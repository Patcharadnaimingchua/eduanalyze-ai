import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Grade, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RequestUser } from '../../auth/request-user.interface';
import { CourseService } from '../../curriculum-content/course/course.service';
import { StudentProfileService } from '../../users/student-profile/student-profile.service';
import { ScopeResolverService } from '../../../common/scope/scope-resolver.service';
import { SemesterService } from '../semester/semester.service';
import { CreateStudentCourseRecordDto } from './dto/create-student-course-record.dto';
import { UpdateStudentCourseRecordDto } from './dto/update-student-course-record.dto';
import { GRADE_POINTS, SEMESTER_TERM_RANK } from './grade-point.constant';

// Colocated with the service that produces it — no separate types file
// exists yet in this module.
export type LatestCourseAttempt = Prisma.StudentCourseRecordGetPayload<{
  include: { semester: { include: { academicYear: true } } };
}>;

export interface StudentRosterEntry {
  studentProfileId: string;
  // The specific latest-attempt record id — additive field (Phase 2.1
  // assessment-evidence UI) so the roster can double as the row source
  // for StudentAssessmentScore upserts, which key off the attempt, not
  // just the student. Computed for free from the same latestAttempts Map
  // this method already builds — no extra query.
  studentCourseRecordId: string;
  studentCode: string;
  fullName: string;
  grade: Grade;
}

export interface GpaSummary {
  gpa: number | null;
  creditsCounted: number;
  courseCount: number;
}

export interface SemesterGpa extends GpaSummary {
  semesterId: string;
}

export interface GpaResult extends GpaSummary {
  // Per-semester breakdown — grouped from RAW records (not the
  // retake-deduped latest-attempt map used for the cumulative gpa above),
  // since a semester's own GPA must reflect what was actually graded that
  // semester, including a course later retaken elsewhere. See the
  // Timeline redesign plan note on why this can't reuse
  // getLatestAttemptsPerCourse.
  bySemester: SemesterGpa[];
}

@Injectable()
export class StudentCourseRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentProfileService: StudentProfileService,
    private readonly courseService: CourseService,
    private readonly semesterService: SemesterService,
    private readonly scopeResolverService: ScopeResolverService,
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
          enteredByUserId: user.userId,
          enteredByRole: this.resolveActingRole(user),
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
  // ADMIN/STAFF (§10): scoped to students in programs their scope covers,
  // same query-level discipline via getCoveredProgramIds.
  async findAll(user: RequestUser) {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      return this.prisma.studentCourseRecord.findMany({
        where: { studentProfileId: own.id, isActive: true },
      });
    }
    if (this.isStaffTier(user)) {
      const programIds = await this.scopeResolverService.getCoveredProgramIds(
        user.userId,
      );
      return this.prisma.studentCourseRecord.findMany({
        where: {
          studentProfile: { programId: { in: programIds } },
          isActive: true,
        },
      });
    }
    return this.prisma.studentCourseRecord.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string, user: RequestUser) {
    const where: Prisma.StudentCourseRecordWhereInput = { id, isActive: true };
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
    if (this.isStaffTier(user)) {
      // Distinct from the 404 above — this is a staff role hitting its
      // scope boundary, not a STUDENT peer probing another student's
      // data, so ScopeGuard's usual 403 convention applies here instead.
      await this.assertStaffScopeCovers(record.studentProfileId, user);
    }
    return record;
  }

  async update(id: string, dto: UpdateStudentCourseRecordDto, user: RequestUser) {
    await this.findOne(id, user);
    return this.prisma.studentCourseRecord.update({
      where: { id },
      data: {
        ...dto,
        // Last-writer, not first: overwritten on every update, so this
        // always answers "who is responsible for the current grade value"
        // — see schema.prisma comment on enteredByUserId.
        enteredByUserId: user.userId,
        enteredByRole: this.resolveActingRole(user),
      },
    });
  }

  // STUDENT deleting their own mis-entered row, or SUPER_ADMIN: hard
  // delete, unchanged (PROJECT_CONTEXT.md §16's original framing still
  // holds for self-correction). ADMIN/STAFF deleting a record that isn't
  // theirs: soft delete — higher risk than correcting your own row, so it
  // stays recoverable/auditable rather than gone outright.
  async remove(id: string, user: RequestUser) {
    await this.findOne(id, user);
    if (this.isStaffTier(user)) {
      return this.prisma.studentCourseRecord.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.studentCourseRecord.delete({ where: { id } });
  }

  // Deterministic, computed live on every call (never cached) — per
  // CONVENTIONS.md §6 and the same "always resolve live" reasoning as
  // §8's scope resolution rule: a cached GPA would need invalidation on
  // every grade write, which is a failure mode this avoids entirely.
  async calculateGpa(
    studentProfileId: string,
    user: RequestUser,
  ): Promise<GpaResult> {
    await this.assertGpaAccess(studentProfileId, user);

    const latestByCourse = await this.getLatestAttemptsPerCourse(studentProfileId);
    const cumulative = this.calculateGpaFromAttempts(latestByCourse);
    const bySemester = await this.calculateGpaBySemester(studentProfileId);

    return { ...cumulative, bySemester };
  }

  // Shared by calculateGpa/calculateGpaBySemester — same self-vs-staff
  // ownership rule, extracted so it isn't duplicated across both.
  private async assertGpaAccess(studentProfileId: string, user: RequestUser) {
    if (this.isSelfServiceOnly(user)) {
      const own = await this.studentProfileService.findByUserId(user.userId);
      if (own.id !== studentProfileId) {
        throw new NotFoundException(
          `Student profile ${studentProfileId} not found`,
        );
      }
    } else {
      await this.studentProfileService.findActiveByIdOrThrow(studentProfileId);
      if (this.isStaffTier(user)) {
        await this.assertStaffScopeCovers(studentProfileId, user);
      }
    }
  }

  // Pure/internal — no I/O, no ownership check, takes already-fetched
  // data. Extracted so CohortAnalytics-style callers (Phase 9 Chunk 3+)
  // can reuse the exact same GPA math on a Map they already fetched for
  // PLO scoring too, instead of querying twice per student.
  calculateGpaFromAttempts(
    latestByCourse: Map<string, LatestCourseAttempt>,
  ): GpaSummary {
    return this.summarizeGpa(Array.from(latestByCourse.values()));
  }

  // Per-semester GPA — deliberately does NOT go through
  // getLatestAttemptsPerCourse's retake dedup (that map only keeps the
  // most recent attempt of each course across the WHOLE transcript, so a
  // course later retaken would silently disappear from the semester it
  // was first attempted in). Groups raw active records by semesterId
  // instead — each semester's GPA reflects exactly what was graded that
  // semester.
  private async calculateGpaBySemester(
    studentProfileId: string,
  ): Promise<SemesterGpa[]> {
    const records = await this.prisma.studentCourseRecord.findMany({
      where: { studentProfileId, isActive: true },
    });

    const bySemesterId = new Map<string, { grade: Grade; credits: number }[]>();
    for (const record of records) {
      const group = bySemesterId.get(record.semesterId) ?? [];
      group.push(record);
      bySemesterId.set(record.semesterId, group);
    }

    return Array.from(bySemesterId.entries()).map(([semesterId, group]) => ({
      semesterId,
      ...this.summarizeGpa(group),
    }));
  }

  // Pure/internal — the weighted-average math shared by the cumulative
  // (retake-deduped) and per-semester (raw) GPA calculations above; only
  // the input array differs between the two callers.
  private summarizeGpa(
    records: { grade: Grade; credits: number }[],
  ): GpaSummary {
    let gradePointSum = 0;
    let creditsCounted = 0;
    for (const record of records) {
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
      courseCount: records.length,
    };
  }

  // Pure/internal — same shape as calculateGpaFromAttempts above, operates
  // on an already-fetched Map. Full distribution over all 12 Grade values
  // (including W/I/S/U) — a raw tally, not pre-filtered like
  // CloAchievementService's own PASS/FAIL-only totalStudents.
  tallyGradeDistribution(
    latestAttempts: Map<string, LatestCourseAttempt>,
  ): Record<Grade, number> {
    const distribution = Object.fromEntries(
      Object.keys(GRADE_POINTS).map((grade) => [grade, 0]),
    ) as Record<Grade, number>;
    for (const record of latestAttempts.values()) {
      distribution[record.grade] += 1;
    }
    return distribution;
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
      where: { studentProfileId, isActive: true },
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
      where: { courseId, isActive: true },
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

  // §9: INSTRUCTOR can view "Student ที่เกี่ยวข้องกับ Course ที่ตัวเองรับผิดชอบ".
  // Reuses getLatestAttemptsPerStudent (same Map already powering Grade
  // Distribution) — no duplicate retake-collapsing logic. Minimal fields
  // only (no email/contact info) — an instructor needs to identify and
  // grade students, not contact them outside the platform.
  async getStudentRosterForCourse(
    courseId: string,
  ): Promise<StudentRosterEntry[]> {
    await this.courseService.findActiveByIdOrThrow(courseId);
    const latestAttempts = await this.getLatestAttemptsPerStudent(courseId);

    const profiles = await this.prisma.studentProfile.findMany({
      where: { id: { in: [...latestAttempts.keys()] } },
      include: { user: { select: { fullName: true } } },
    });
    const profileById = new Map(profiles.map((p) => [p.id, p]));

    return [...latestAttempts.entries()]
      .map(([studentProfileId, attempt]) => {
        const profile = profileById.get(studentProfileId)!;
        return {
          studentProfileId,
          studentCourseRecordId: attempt.id,
          studentCode: profile.studentCode,
          fullName: profile.user.fullName,
          grade: attempt.grade,
        };
      })
      .sort((a, b) => a.studentCode.localeCompare(b.studentCode));
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

  // §10: ADMIN/STAFF get scoped write access alongside STUDENT's unchanged
  // self-service and SUPER_ADMIN's unchanged unrestricted access — a
  // student never has ADMIN/STAFF too (registration only ever assigns
  // STUDENT, per PROJECT_CONTEXT.md §33), so this and isSelfServiceOnly
  // are mutually exclusive in practice.
  private isStaffTier(user: RequestUser) {
    return (
      (user.roles.includes('ADMIN') || user.roles.includes('STAFF')) &&
      !user.roles.includes('SUPER_ADMIN')
    );
  }

  // Audit-trail snapshot for enteredByRole — most-privileged role wins if
  // a user somehow holds more than one (STUDENT never co-occurs with
  // ADMIN/STAFF/SUPER_ADMIN in practice, per §33, so this is unambiguous).
  private resolveActingRole(user: RequestUser): Role {
    if (user.roles.includes('SUPER_ADMIN')) return Role.SUPER_ADMIN;
    if (user.roles.includes('ADMIN')) return Role.ADMIN;
    if (user.roles.includes('STAFF')) return Role.STAFF;
    return Role.STUDENT;
  }

  private async assertStaffScopeCovers(
    studentProfileId: string,
    user: RequestUser,
  ) {
    const ancestry = await this.scopeResolverService.resolveAncestry(
      'studentProfile',
      studentProfileId,
    );
    const effectiveScopes = await this.scopeResolverService.getEffectiveScopes(
      user.userId,
    );
    if (!this.scopeResolverService.isCovered(ancestry, effectiveScopes)) {
      throw new ForbiddenException(
        'You do not have scope covering this student',
      );
    }
  }

  // STUDENT: always their own profile, resolved server-side — the
  // client-supplied studentProfileId is ignored so a student can never
  // create/read a record under someone else's profile.
  // SUPER_ADMIN: uses the client-supplied studentProfileId, validated.
  // ADMIN/STAFF: uses the client-supplied studentProfileId, validated and
  // scope-checked.
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
    if (this.isStaffTier(user)) {
      await this.assertStaffScopeCovers(profile.id, user);
    }
    return profile.id;
  }
}
