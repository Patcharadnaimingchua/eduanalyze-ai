import { Injectable } from '@nestjs/common';
import { RequestUser } from '../../auth/request-user.interface';
import { CreditCheckerService } from '../credit-checker/credit-checker.service';
import { StudentCourseRecordService } from '../student-course-record/student-course-record.service';
import {
  AvailableCourse,
  IncompleteElectiveCategory,
  LearningPathReport,
} from './learning-path-report.interface';

@Injectable()
export class LearningPathService {
  constructor(
    private readonly creditCheckerService: CreditCheckerService,
    private readonly studentCourseRecordService: StudentCourseRecordService,
  ) {}

  async getLearningPath(
    studentProfileId: string,
    user: RequestUser,
  ): Promise<LearningPathReport> {
    // checkCredits already enforces self-ownership (STUDENT: own profile
    // only, 404 otherwise; SUPER_ADMIN: any valid profile) — once it
    // succeeds, studentProfileId is known-authorized for the rest of this
    // method, so the calls below (which take no ownership check of their
    // own, by design — see their own doc comments) are safe.
    const report = await this.creditCheckerService.checkCredits(
      studentProfileId,
      user,
    );

    const curriculum = await this.creditCheckerService.loadCurriculumTree(
      report.curriculumId,
    );
    const latestByCourse =
      await this.studentCourseRecordService.getLatestAttemptsPerCourse(
        studentProfileId,
      );
    const passedCourseIds = this.creditCheckerService.computePassedCourseIds(
      curriculum,
      latestByCourse,
    );

    const availableCourses: AvailableCourse[] = [];
    const incompleteElectiveCategories: IncompleteElectiveCategory[] = [];

    for (const category of curriculum.categories) {
      const categoryAvailableElectives: AvailableCourse[] = [];

      for (const course of category.courses) {
        if (passedCourseIds.has(course.id)) {
          continue;
        }
        if (
          !this.creditCheckerService.isCoursePrerequisiteSatisfied(
            course,
            passedCourseIds,
          )
        ) {
          continue;
        }

        const available: AvailableCourse = {
          courseId: course.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          grade: latestByCourse.get(course.id)?.grade,
          isRequired: course.isRequired,
        };
        availableCourses.push(available);
        if (!course.isRequired) {
          categoryAvailableElectives.push(available);
        }
      }

      // §28's "Elective ที่ยังขาด" is a category-level credit gap — an
      // individual elective course is never itself "required" (only
      // Course.isRequired courses are), only a category's minCredits/
      // minCourses target can be short. Pass-through categoryProgress
      // from `report` rather than recomputing isComplete/creditsEarned.
      //
      // "No required courses in this category" (not "has elective
      // courses") is the right condition — it's true both for
      // electives-only categories AND for categories with zero Course
      // rows at all (e.g. วิชาเลือกเสรี/Free Elective, and several Gen Ed
      // categories — no catalog was imported for these in Phase 4, by
      // design, see TODO.md). A category mixing required + elective
      // courses is still excluded here since any gap there is already
      // covered by missingRequiredCourses.
      const progress = report.categoryProgress.find(
        (c) => c.categoryId === category.id,
      );
      const hasNoRequiredCourses = !category.courses.some((c) => c.isRequired);
      if (progress && !progress.isComplete && hasNoRequiredCourses) {
        incompleteElectiveCategories.push({
          categoryId: category.id,
          name: category.name,
          creditsEarned: progress.creditsEarned,
          minCredits: progress.minCredits,
          creditsShort: Math.max(0, progress.minCredits - progress.creditsEarned),
          availableElectivesInCategory: categoryAvailableElectives,
        });
      }
    }

    const nextSemesterPlan = this.computeNextSemesterPlan(
      availableCourses,
      curriculum.maxCreditsPerSemester,
    );

    return {
      studentProfileId: report.studentProfileId,
      curriculumId: report.curriculumId,
      availableCourses,
      missingRequiredCourses: report.missingRequiredCourses,
      incompleteElectiveCategories,
      graduationReadiness: report.graduationReadiness,
      nextSemesterPlan,
    };
  }

  // One semester ahead only (see LearningPathReport doc comment) — greedy
  // fill, required courses first (then code ascending for determinism,
  // matching the orderBy:{code:'asc'} convention used elsewhere in this
  // codebase). A course that doesn't fit the remaining headroom is
  // skipped, not a hard stop — a smaller elective later in the list can
  // still fill the gap.
  private computeNextSemesterPlan(
    availableCourses: AvailableCourse[],
    maxCredits: number,
  ): AvailableCourse[] {
    const sorted = [...availableCourses].sort((a, b) => {
      if (a.isRequired !== b.isRequired) {
        return a.isRequired ? -1 : 1;
      }
      return a.code.localeCompare(b.code);
    });

    const plan: AvailableCourse[] = [];
    let runningTotal = 0;
    for (const course of sorted) {
      if (runningTotal + course.credits <= maxCredits) {
        plan.push(course);
        runningTotal += course.credits;
      }
    }
    return plan;
  }
}
