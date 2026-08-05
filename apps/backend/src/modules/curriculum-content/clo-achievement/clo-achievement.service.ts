import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ACHIEVED_GRADES,
  GRADE_STATUS,
} from '../../academic-record/student-course-record/grade-point.constant';
import { StudentCourseRecordService } from '../../academic-record/student-course-record/student-course-record.service';
import { CurriculumService } from '../../organization/curriculum/curriculum.service';
import { CourseService } from '../course/course.service';
import { CourseCloAchievementReport } from './clo-achievement-report.interface';

@Injectable()
export class CloAchievementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
    private readonly curriculumService: CurriculumService,
    private readonly studentCourseRecordService: StudentCourseRecordService,
  ) {}

  // Deterministic, computed live on every call — same "never cached"
  // reasoning as GPA/Credit Checker (CONVENTIONS.md §6/§8).
  async calculateForCourse(courseId: string): Promise<CourseCloAchievementReport> {
    const course = await this.courseService.findActiveByIdOrThrow(courseId);
    const curriculum = await this.curriculumService.findActiveByIdOrThrow(
      course.curriculumId,
    );

    const clos = await this.prisma.clo.findMany({
      where: { courseId, isActive: true },
    });

    const latestByStudent =
      await this.studentCourseRecordService.getLatestAttemptsPerStudent(
        courseId,
      );

    // totalStudents excludes W/I (never completed the course) — same
    // GRADE_STATUS distinction as Phase 7's Credit Checker: PASS+FAIL are
    // final outcomes and count, EXCLUDED does not.
    let totalStudents = 0;
    let achievedStudents = 0;
    for (const attempt of latestByStudent.values()) {
      if (GRADE_STATUS[attempt.grade] === 'EXCLUDED') {
        continue;
      }
      totalStudents += 1;
      if (ACHIEVED_GRADES.has(attempt.grade)) {
        achievedStudents += 1;
      }
    }

    const achievementPercent =
      totalStudents > 0 ? (achievedStudents / totalStudents) * 100 : 0;

    // Every CLO of this course shares the same achievementPercent — the
    // schema has no CLO-specific grade breakdown (only one grade per
    // StudentCourseRecord, covering the whole course). See TODO.md
    // "Phase 8 — CLO Achievement" for the known limitation and what a
    // more granular design would require.
    return {
      courseId: course.id,
      totalStudents,
      achievedStudents,
      achievementPercent,
      clos: clos.map((clo) => {
        const threshold =
          clo.achievementThreshold ?? curriculum.defaultAchievementThreshold;
        return {
          cloId: clo.id,
          code: clo.code,
          description: clo.description,
          threshold,
          isAchieved: achievementPercent >= threshold,
        };
      }),
    };
  }
}
