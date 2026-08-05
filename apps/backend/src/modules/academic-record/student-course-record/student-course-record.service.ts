import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestUser } from '../../auth/request-user.interface';
import { CourseService } from '../../curriculum-content/course/course.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { SemesterService } from '../semester/semester.service';
import { CreateStudentCourseRecordDto } from './dto/create-student-course-record.dto';
import { UpdateStudentCourseRecordDto } from './dto/update-student-course-record.dto';
import { GRADE_POINTS, SEMESTER_TERM_RANK } from './grade-point.constant';

// Colocated with the service that produces it — no separate types file
// exists yet in this module.
export type LatestCourseAttempt = Prisma.StudentCourseRecordGetPayload<{
  include: { semester: { include: { academicYear: true } } };
}>;

@Injectable()
export class StudentCourseRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfileService: StudentProfileService,
    private readonly courseService: CourseService,
    private readonly semesterService: SemesterService,
  ) {}

  async create(dto: CreateStudentCourseRecordDto, user: RequestUser) {
    const studentProfileId = await this.resolveOwnStudentProfileIdOrValidate(
      dto.studentProfileId,
      user,
    );

    const course = await this.courseService.findActiveByIdOrThrow(dto.courseId);
    await this.semesterService.findActiveByIdOrThrow(dto.semesterId);

    try {
      return await this.prisma.studentCourseRecord.create({
        data: {
          studentProfileId,
          courseId: dto.courseId,
          semesterId: dto.semesterId,
          grade: dto.grade,
          // Snapshot, not a live join — see schema.prisma comment on
          // StudentCourseRecord.credits.
          credits: course.credits,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A record for course ${dto.courseId} in semester ${dto.semesterId} already exists for this student`,
        );
      }
      throw error;
    }
  }

  // Per CONVENTIONS.md §3a: STUDENT sees only their own rows, filtered at
  // the query level — never fetched in full and filtered in memory.
  async findAll(user: RequestUser) {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      return this.prisma.studentCourseRecord.findMany({
        where: { studentProfileId: own.id },
      });
    }
    return this.prisma.studentCourseRecord.findMany();
  }

  async findOne(id: string, user: RequestUser) {
    const where: Prisma.StudentCourseRecordWhereInput = { id };
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      where.studentProfileId = own.id;
    }

    const record = await this.prisma.studentCourseRecord.findFirst({ where });
    if (!record) {
      // Same exception for "doesn't exist" and "exists but isn't yours" —
      // see CONVENTIONS.md §3a on avoiding a 403 information leak.
      throw new NotFoundException(`Student course record ${id} not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateStudentCourseRecordDto, user: RequestUser) {
    await this.findOne(id, user);
    return this.prisma.studentCourseRecord.update({
      where: { id },
      data: dto,
    });
  }

  // Hard-delete — PROJECT_CONTEXT.md §16 frames this as the student
  // correcting a mis-entered row, not something requiring an audit trail.
  async remove(id: string, user: RequestUser) {
    await this.findOne(id, user);
    return this.prisma.studentCourseRecord.delete({ where: { id } });
  }

  // Deterministic, computed live on every call (never cached) — per
  // CONVENTIONS.md §6 and the same "always resolve live" reasoning as
  // §8's scope resolution rule: a cached GPA would need invalidation on
  // every grade write, which is a failure mode this avoids entirely.
  async calculateGpa(studentProfileId: string, user: RequestUser) {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      if (own.id !== studentProfileId) {
        throw new NotFoundException(
          `Student profile ${studentProfileId} not found`,
        );
      }
    } else {
      await this.studentProfileService.findActiveByIdOrThrow(studentProfileId);
    }

    const latestByCourse = await this.getLatestAttemptsPerCourse(studentProfileId);
    return this.calculateGpaFromAttempts(latestByCourse);
  }

  // Pure/internal — no I/O, no ownership check, takes already-fetched
  // data. Extracted so CohortAnalytics-style callers (Phase 9 Chunk 3+)
  // can reuse the exact same GPA math on a Map they already fetched for
  // PLO scoring too, instead of querying twice per student.
  calculateGpaFromAttempts(latestByCourse: Map<string, LatestCourseAttempt>) {
    let gradePointSum = 0;
    let creditsCounted = 0;
    for (const record of latestByCourse.values()) {
      const gradePoint = GRADE_POINTS[record.grade];
      if (gradePoint === null) {
        continue; // W/I/S/U — excluded from both numerator and denominator
      }
      gradePointSum += gradePoint * record.credits;
      creditsCounted += record.credits;
    }

    return {
      gpa: creditsCounted > 0 ? gradePointSum / creditsCounted : null,
      creditsCounted,
      courseCount: latestByCourse.size,
    };
  }

  // Retake policy (confirmed in Phase 6): the latest attempt replaces
  // earlier ones — group by courseId, keep only the record from the most
  // recent (academicYear.year, term) per course. Shared by calculateGpa
  // and CreditCheckerService (per CONVENTIONS.md §6, never reimplemented
  // at a second call site). No ownership check here — the caller must
  // have already validated studentProfileId belongs to the requester.
  async getLatestAttemptsPerCourse(
    studentProfileId: string,
  ): Promise<Map<string, LatestCourseAttempt>> {
    const records = await this.prisma.studentCourseRecord.findMany({
      where: { studentProfileId },
      include: { semester: { include: { academicYear: true } } },
    });

    const latestByCourse = new Map<string, LatestCourseAttempt>();
    for (const record of records) {
      const existing = latestByCourse.get(record.courseId);
      if (!existing || this.isLaterAttempt(record, existing)) {
        latestByCourse.set(record.courseId, record);
      }
    }
    return latestByCourse;
  }

  // Mirror of getLatestAttemptsPerCourse, grouped the other direction —
  // per student instead of per course — for CloAchievementService, which
  // needs every student's latest attempt of ONE course rather than one
  // student's latest attempt of every course. Same retake policy, same
  // isLaterAttempt logic reused. No ownership check here either — this
  // is a Course-scoped aggregate read, not a student-scoped one.
  async getLatestAttemptsPerStudent(
    courseId: string,
  ): Promise<Map<string, LatestCourseAttempt>> {
    const records = await this.prisma.studentCourseRecord.findMany({
      where: { courseId },
      include: { semester: { include: { academicYear: true } } },
    });

    const latestByStudent = new Map<string, LatestCourseAttempt>();
    for (const record of records) {
      const existing = latestByStudent.get(record.studentProfileId);
      if (!existing || this.isLaterAttempt(record, existing)) {
        latestByStudent.set(record.studentProfileId, record);
      }
    }
    return latestByStudent;
  }

  private isLaterAttempt(
    candidate: { semester: { term: keyof typeof SEMESTER_TERM_RANK; academicYear: { year: number } } },
    current: { semester: { term: keyof typeof SEMESTER_TERM_RANK; academicYear: { year: number } } },
  ) {
    if (candidate.semester.academicYear.year !== current.semester.academicYear.year) {
      return candidate.semester.academicYear.year > current.semester.academicYear.year;
    }
    return SEMESTER_TERM_RANK[candidate.semester.term] > SEMESTER_TERM_RANK[current.semester.term];
  }

  private isSelfServiceOnly(user: RequestUser) {
    return user.roles.includes('STUDENT') && !user.roles.includes('SUPER_ADMIN');
  }

  // STUDENT: always their own profile, resolved server-side — the
  // client-supplied studentProfileId is ignored so a student can never
  // create/read a record under someone else's profile.
  // SUPER_ADMIN: uses the client-supplied studentProfileId, validated.
  private async resolveOwnStudentProfileIdOrValidate(
    suppliedStudentProfileId: string,
    user: RequestUser,
  ) {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      return own.id;
    }
    const profile = await this.studentProfileService.findActiveByIdOrThrow(
      suppliedStudentProfileId,
    );
    return profile.id;
  }
}
