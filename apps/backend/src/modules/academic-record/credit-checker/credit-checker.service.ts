import { Injectable, NotFoundException } from '@nestjs/common';
import { StudentProfile } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestUser } from '../../auth/request-user.interface';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { GRADE_STATUS } from '../student-course-record/grade-point.constant';
import { StudentCourseRecordService } from '../student-course-record/student-course-record.service';
import {
  CategoryProgress,
  CourseSummary,
  CreditCheckReport,
  GraduationReadiness,
} from './credit-checker-report.interface';

@Injectable()
export class CreditCheckerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfileService: StudentProfileService,
    private readonly studentCourseRecordService: StudentCourseRecordService,
  ) {}

  async checkCredits(
    studentProfileId: string,
    user: RequestUser,
  ): Promise<CreditCheckReport> {
    const profile = await this.resolveOwnProfileOrValidate(
      studentProfileId,
      user,
    );

    const curriculum = await this.prisma.curriculum.findUniqueOrThrow({
      where: { id: profile.curriculumId },
      include: {
        categories: {
          where: { isActive: true },
          include: {
            requirement: true,
            courses: {
              where: { isActive: true },
              include: { prerequisitesRequired: true },
            },
          },
        },
      },
    });

    const latestByCourse =
      await this.studentCourseRecordService.getLatestAttemptsPerCourse(
        profile.id,
      );

    // Per PROJECT_CONTEXT.md §18: every metric below is computed by
    // iterating the STUDENT'S OWN curriculum's courses and looking each up
    // in the latest-attempts map — never by summing the map directly
    // (unlike calculateGpa, which is a whole-transcript metric, not
    // curriculum-scoped). This guards against a stray record pointing at
    // a course from a different curriculum ever leaking into these totals.

    // First pass: which courses in this curriculum has the student passed?
    // Needed up front so the prerequisite check below doesn't depend on
    // category iteration order.
    const passedCourseIds = new Set<string>();
    for (const category of curriculum.categories) {
      for (const course of category.courses) {
        const attempt = latestByCourse.get(course.id);
        const status = attempt ? GRADE_STATUS[attempt.grade] : 'EXCLUDED';
        if (status === 'PASS') {
          passedCourseIds.add(course.id);
        }
      }
    }

    const passedCourses: CourseSummary[] = [];
    const failedCourses: CourseSummary[] = [];
    const notYetStudiedCourses: CourseSummary[] = [];
    const missingRequiredCourses: (CourseSummary & {
      isPrerequisiteSatisfied: boolean;
    })[] = [];
    const categoryProgress: CategoryProgress[] = [];

    let creditsStudied = 0;
    let creditsPassed = 0;

    for (const category of curriculum.categories) {
      let categoryCreditsEarned = 0;
      let categoryCoursesPassedCount = 0;

      for (const course of category.courses) {
        const attempt = latestByCourse.get(course.id);
        const status = attempt ? GRADE_STATUS[attempt.grade] : 'EXCLUDED';
        const summary: CourseSummary = {
          courseId: course.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          grade: attempt?.grade,
        };

        if (status === 'PASS') {
          passedCourses.push(summary);
          creditsStudied += course.credits;
          creditsPassed += course.credits;
          categoryCreditsEarned += course.credits;
          categoryCoursesPassedCount += 1;
        } else if (status === 'FAIL') {
          failedCourses.push(summary);
          creditsStudied += course.credits;
        } else {
          // EXCLUDED (W/I) or no record at all — same bucket, see
          // grade-point.constant.ts comment on GRADE_STATUS.
          notYetStudiedCourses.push(summary);
        }

        if (course.isRequired && status !== 'PASS') {
          const isPrerequisiteSatisfied = course.prerequisitesRequired.every(
            (p) => passedCourseIds.has(p.prerequisiteCourseId),
          );
          missingRequiredCourses.push({ ...summary, isPrerequisiteSatisfied });
        }
      }

      // requirement is nullable (1:1, a category may have no
      // CurriculumRequirement row) — treat as always-satisfied rather
      // than crashing on null.minCredits.
      const minCredits = category.requirement?.minCredits ?? 0;
      const minCourses = category.requirement?.minCourses ?? null;
      const isComplete =
        categoryCreditsEarned >= minCredits &&
        (minCourses === null || categoryCoursesPassedCount >= minCourses);

      categoryProgress.push({
        categoryId: category.id,
        name: category.name,
        minCredits,
        minCourses,
        creditsEarned: categoryCreditsEarned,
        coursesPassedCount: categoryCoursesPassedCount,
        isComplete,
      });
    }

    const creditsRemaining = curriculum.totalCredits - creditsPassed;
    const allCategoriesMet = categoryProgress.every((c) => c.isComplete);
    const creditsMet = creditsPassed >= curriculum.totalCredits;
    const graduationReadiness: GraduationReadiness = {
      isReady:
        creditsMet && allCategoriesMet && missingRequiredCourses.length === 0,
      creditsMet,
      allCategoriesMet,
      missingRequiredCount: missingRequiredCourses.length,
    };

    return {
      studentProfileId: profile.id,
      curriculumId: curriculum.id,
      totalCreditsRequired: curriculum.totalCredits,
      creditsStudied,
      creditsPassed,
      // Alias — see credit-checker-report.interface.ts comment.
      creditsAccumulated: creditsPassed,
      creditsRemaining,
      passedCourses,
      failedCourses,
      notYetStudiedCourses,
      missingRequiredCourses,
      categoryProgress,
      graduationReadiness,
    };
  }

  private isSelfServiceOnly(user: RequestUser) {
    return (
      user.roles.includes('STUDENT') && !user.roles.includes('SUPER_ADMIN')
    );
  }

  // Same self-ownership shape as StudentCourseRecordService, but returns
  // the full StudentProfile row (not just the id) since checkCredits needs
  // profile.curriculumId next.
  private async resolveOwnProfileOrValidate(
    suppliedStudentProfileId: string,
    user: RequestUser,
  ): Promise<StudentProfile> {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      if (own.id !== suppliedStudentProfileId) {
        throw new NotFoundException(
          `Student profile ${suppliedStudentProfileId} not found`,
        );
      }
      return own;
    }
    return this.studentProfileService.findActiveByIdOrThrow(
      suppliedStudentProfileId,
    );
  }
}
