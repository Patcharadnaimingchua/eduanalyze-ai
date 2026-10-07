// Demo data for looking at every role's pages with realistic volume.
// Run:  npx ts-node prisma/seed-demo.ts            (dry run: prints the plan)
//       npx ts-node prisma/seed-demo.ts --confirm  (writes, one transaction)
//
// Insert-only: never UPDATEs or DELETEs an existing row. Everything it adds is
// listed in apps/backend/.backups/demo-manifest.json (git-ignored) and carries
// a marker (student code DEMO-GEN-NNNN, email demo-gen-NNNN@test.local) so
// cleanup-demo.ts can remove exactly this set. Deterministic (fixed PRNG seed)
// and re-runnable: a second run adds nothing.
import { randomBytes, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Grade, PrismaClient, SemesterTerm } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEV_DB_NAME = 'eduanalyze_ai';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', 'postgres'];
const MANIFEST = join(__dirname, '..', '.backups', 'demo-manifest.json');
// The three courses the DEMO-GEN records live in, in this curriculum (the same
// codes also exist in another one). Named here, not read from the demo
// instructor's assignments, because those can change without touching the
// demo students.
const DEMO_CURRICULUM_ID = 'bc550250-7144-4518-b3ee-5ac072e09f5d';
const DEMO_COURSE_CODES = ['01999111', '02739111', '02739321'];
// The instructor who teaches those courses in the demo. Existing assignments (such
// as 02739341) are left as they are; only the missing ones are inserted.
const DEMO_INSTRUCTOR_EMAIL = 'demo-instructor@test.local';
const STUDENT_COUNT = 150;
const SUSPENDED_COUNT = 5; // ~3%
const NO_RECORD_COUNT = 12; // ~8%
// Low-GPA cohort appended after the first STUDENT_COUNT (codes 0151+), so the
// demo shows the GPA status bands: with the ~147 already active this lands
// near 8% urgent (GPA < 1.50) and 10% watch (1.50 - 1.74) of everyone active.
const LOW_GPA_URGENT = 12;
const LOW_GPA_WATCH = 15;
const LOW_GPA_NORMAL = 5; // low-ish but >= 2.00, so the cohort is not all flagged
// Existing Semester rows only (all active in the dev DB); none is created.
const TERMS: { year: number; term: SemesterTerm }[] = [
  { year: 2567, term: 'SECOND' },
  { year: 2568, term: 'FIRST' },
  { year: 2568, term: 'SECOND' },
  { year: 2569, term: 'FIRST' },
];

function assertSafeTarget(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run: NODE_ENV=production');
  }
  const url = new URL(process.env.DATABASE_URL ?? '');
  const db = url.pathname.replace(/^\//, '');
  if (db !== DEV_DB_NAME) throw new Error(`Refusing to run: database "${db}" is not "${DEV_DB_NAME}"`);
  if (!LOCAL_HOSTS.includes(url.hostname)) throw new Error(`Refusing to run: host "${url.hostname}" is not local`);
}

// mulberry32: small seeded PRNG, same sequence every run.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20261008);
const randInt = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Separate PRNG for the low-GPA cohort: the main plan above must draw exactly
// what it drew when the first 150 were inserted, or a re-run would plan new
// records for them.
const rngLow = makeRng(20261009);
const GRADE_POINT: Partial<Record<Grade, number>> = { A: 4, B_PLUS: 3.5, B: 3, C_PLUS: 2.5, C: 2, D_PLUS: 1.5, D: 1, F: 0 };
const LOW_POOL: Grade[] = ['B', 'C_PLUS', 'C', 'D_PLUS', 'D', 'F'];
const BANDS = {
  URGENT: (gpa: number) => gpa < 1.5,
  WATCH: (gpa: number) => gpa >= 1.5 && gpa < 1.75,
  NORMAL: (gpa: number) => gpa >= 2.0 && gpa < 2.5,
};

const GRADES: Grade[] = ['A', 'B_PLUS', 'B', 'C_PLUS', 'C', 'D_PLUS', 'D', 'F', 'W', 'I', 'S'];
const EASY = [0.26, 0.22, 0.2, 0.12, 0.08, 0.03, 0.02, 0.02, 0.02, 0.02, 0.01];
const MEDIUM = [0.12, 0.17, 0.22, 0.18, 0.13, 0.06, 0.04, 0.03, 0.03, 0.01, 0.01];
const HARD = [0.05, 0.08, 0.14, 0.18, 0.2, 0.1, 0.08, 0.09, 0.05, 0.02, 0.01];

// termIndex nudges later terms slightly easier so trend cards are not flat;
// a "struggler" student is pushed toward the low grades.
function drawGrade(base: number[], termIndex: number, struggler: boolean, noFailOrWithdraw = false): Grade {
  const w = base.map((p, i) => {
    let x = p;
    if (i <= 2) x *= 1 + 0.06 * termIndex;
    if (struggler) x *= i <= 2 ? 0.4 : i >= 4 && i <= 7 ? 2.2 : 1;
    if (noFailOrWithdraw && (i === 7 || i === 8 || i === 9)) x = 0;
    return x;
  });
  const total = w.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r <= 0) return GRADES[i];
  }
  return 'C';
}

const FIRST = ['สมชาย', 'สมหญิง', 'ธนากร', 'พิมพ์ชนก', 'กิตติพงษ์', 'วรรณา', 'ปิยะ', 'นภัสสร', 'ภาคิน', 'ชลธิชา', 'อภิชาติ', 'รัตนา', 'ณัฐวุฒิ', 'กัญญา', 'วีรภัทร', 'ศิริพร', 'ธีรภัทร', 'มณีรัตน์', 'พัชรพล', 'อารียา'];
const LAST = ['ใจดี', 'รักเรียน', 'ทองคำ', 'สุขสันต์', 'มั่นคง', 'บุญมี', 'ศรีสุข', 'พงษ์ไทย', 'แสงทอง', 'วงศ์ใหญ่', 'เจริญผล', 'ชัยมงคล', 'พูนสิน', 'คำดี', 'อินทร์แก้ว'];

interface PlannedStudent {
  index: number;
  code: string;
  email: string;
  fullName: string;
  admissionYear: number;
  suspended: boolean;
  hasRecords: boolean;
  struggler: boolean;
}
interface PlannedRecord {
  studentCode: string;
  courseId: string;
  semesterKey: string;
  grade: Grade;
}

interface Manifest {
  createdAt: string;
  users: string[];
  userRoles: string[];
  studentProfiles: string[];
  studentCourseRecords: string[];
  courseInstructors?: string[];
  semesters: string[];
  academicYears: string[];
}

function readManifest(): Manifest {
  if (existsSync(MANIFEST)) return JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest;
  return { createdAt: new Date().toISOString(), users: [], userRoles: [], studentProfiles: [], studentCourseRecords: [], semesters: [], academicYears: [] };
}

async function main() {
  assertSafeTarget();
  const confirm = process.argv.includes('--confirm');

  const courses = await prisma.course.findMany({
    where: { curriculumId: DEMO_CURRICULUM_ID, code: { in: DEMO_COURSE_CODES }, isActive: true },
    orderBy: { code: 'asc' },
  });
  if (courses.length !== DEMO_COURSE_CODES.length) {
    throw new Error(`expected active courses ${DEMO_COURSE_CODES.join(', ')}, found ${courses.map((c) => c.code).join(', ') || 'none'}`);
  }
  const curriculumIds = new Set(courses.map((c) => c.curriculumId));
  if (curriculumIds.size !== 1) throw new Error('the demo courses span several curricula');
  const curriculum = await prisma.curriculum.findUniqueOrThrow({ where: { id: courses[0].curriculumId } });
  const programId = curriculum.programId;

  const semesters = new Map<string, string>();
  for (const t of TERMS) {
    const sem = await prisma.semester.findFirst({
      where: { term: t.term, isActive: true, academicYear: { year: t.year, isActive: true } },
    });
    if (!sem) throw new Error(`semester ${t.year}/${t.term} not found (this script does not create one)`);
    semesters.set(`${t.year}-${t.term}`, sem.id);
  }
  const semKeys = TERMS.map((t) => `${t.year}-${t.term}`);

  // ---- plan (pure function of the PRNG seed) ----
  const students: PlannedStudent[] = [];
  for (let i = 1; i <= STUDENT_COUNT; i++) {
    const n = String(i).padStart(4, '0');
    students.push({
      index: i,
      code: `DEMO-GEN-${n}`,
      email: `demo-gen-${n}@test.local`,
      fullName: `${FIRST[randInt(0, FIRST.length - 1)]} ${LAST[randInt(0, LAST.length - 1)]}`,
      admissionYear: 2566 + ((i - 1) % 4),
      suspended: false,
      hasRecords: true,
      struggler: rng() < 0.07,
    });
  }
  const order = shuffle(students.map((s) => s.index));
  order.slice(0, NO_RECORD_COUNT).forEach((i) => (students[i - 1].hasRecords = false));
  order.slice(NO_RECORD_COUNT, NO_RECORD_COUNT + SUSPENDED_COUNT).forEach((i) => (students[i - 1].suspended = true));

  const difficulty = [EASY, MEDIUM, HARD];
  const records: PlannedRecord[] = [];
  courses.forEach((course, ci) => {
    const load = new Map<string, number>(semKeys.map((k) => [k, 0]));
    const withRecords = students.filter((s) => s.hasRecords);
    const pending = new Map<string, number>(); // studentCode -> term index of the retake
    for (const s of shuffle(withRecords)) {
      if (rng() > 0.97) continue; // a few simply never took this course
      const eligible = semKeys.filter((k) => Number(k.slice(0, 4)) >= s.admissionYear);
      const pick = [...eligible].sort((a, b) => (load.get(a)! - load.get(b)!) || (rng() < 0.5 ? -1 : 1))[0];
      load.set(pick, load.get(pick)! + 1);
      const ti = semKeys.indexOf(pick);
      const grade = drawGrade(difficulty[ci], ti, s.struggler);
      records.push({ studentCode: s.code, courseId: course.id, semesterKey: pick, grade });
      if (grade === 'F' && ti < semKeys.length - 1 && rng() < 0.8) pending.set(s.code, ti + 1);
    }
    for (const [code, ti] of pending) {
      records.push({
        studentCode: code,
        courseId: course.id,
        semesterKey: semKeys[ti],
        grade: drawGrade(difficulty[ci], ti, false, true),
      });
    }
  });

  // ---- low-GPA cohort: one graded attempt in each of 2-3 of the courses, grades
  // chosen so the credit-weighted GPA lands in the wanted band ----
  const lowStudents: PlannedStudent[] = [];
  const bandOf: Record<string, keyof typeof BANDS> = {};
  const wanted: (keyof typeof BANDS)[] = [
    ...Array<keyof typeof BANDS>(LOW_GPA_URGENT).fill('URGENT'),
    ...Array<keyof typeof BANDS>(LOW_GPA_WATCH).fill('WATCH'),
    ...Array<keyof typeof BANDS>(LOW_GPA_NORMAL).fill('NORMAL'),
  ];
  for (let k = wanted.length - 1; k > 0; k--) {
    const j = Math.floor(rngLow() * (k + 1));
    [wanted[k], wanted[j]] = [wanted[j], wanted[k]];
  }
  wanted.forEach((band, k) => {
    const i = STUDENT_COUNT + 1 + k;
    const n = String(i).padStart(4, '0');
    const admissionYear = 2566 + (k % 4);
    lowStudents.push({
      index: i,
      code: `DEMO-GEN-${n}`,
      email: `demo-gen-${n}@test.local`,
      fullName: `${FIRST[Math.floor(rngLow() * FIRST.length)]} ${LAST[Math.floor(rngLow() * LAST.length)]}`,
      admissionYear,
      suspended: false,
      hasRecords: true,
      struggler: true,
    });
    bandOf[`DEMO-GEN-${n}`] = band;
    const eligibleKeys = semKeys.filter((key) => Number(key.slice(0, 4)) >= admissionYear);
    for (let attempt = 0; ; attempt++) {
      if (attempt > 500) throw new Error(`no grade combination reaches band ${band}`);
      const take = courses.filter(() => rngLow() < 0.8);
      const chosen = take.length >= 2 ? take : courses;
      const grades = chosen.map(() => LOW_POOL[Math.floor(rngLow() * LOW_POOL.length)]);
      const credits = chosen.reduce((sum, c) => sum + c.credits, 0);
      const gpa = chosen.reduce((sum, c, ci) => sum + GRADE_POINT[grades[ci]]! * c.credits, 0) / credits;
      if (!BANDS[band](gpa)) continue;
      chosen.forEach((c, ci) =>
        records.push({
          studentCode: `DEMO-GEN-${n}`,
          courseId: c.id,
          semesterKey: eligibleKeys[Math.floor(rngLow() * eligibleKeys.length)],
          grade: grades[ci],
        }),
      );
      break;
    }
  });
  students.push(...lowStudents);

  const demoInstructor = await prisma.user.findUnique({
    where: { email: DEMO_INSTRUCTOR_EMAIL },
    select: { id: true },
  });
  if (!demoInstructor) throw new Error(`${DEMO_INSTRUCTOR_EMAIL} not found; assignments cannot be added`);
  const assigned = new Set(
    (
      await prisma.courseInstructor.findMany({
        where: { userId: demoInstructor.id, courseId: { in: courses.map((c) => c.id) } },
        select: { courseId: true },
      })
    ).map((a) => a.courseId),
  );
  const missingAssignments = courses.filter((c) => !assigned.has(c.id));

  console.log(`target db ok; demo courses: ${courses.map((c) => c.code).join(', ')}; program ${programId}, curriculum ${curriculum.id}`);
  console.log(`plan: ${students.length} students (${students.filter((s) => s.suspended).length} suspended, ${students.filter((s) => !s.hasRecords).length} without records), ${records.length} records`);
  console.log(`plan: ${missingAssignments.length} course assignments for ${DEMO_INSTRUCTOR_EMAIL} (${missingAssignments.map((c) => c.code).join(', ') || 'none missing'})`);
  if (!confirm) {
    console.log('dry run only; pass --confirm to write');
    return;
  }

  const passwordHash = (): Promise<string> => bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const manifest = readManifest();
  const added = { users: 0, userRoles: 0, studentProfiles: 0, studentCourseRecords: 0, courseInstructors: 0 };
  manifest.courseInstructors ??= [];

  await prisma.$transaction(
    async (tx) => {
      const existingUsers = await tx.user.findMany({
        where: { email: { in: students.map((s) => s.email) } },
        select: { id: true, email: true },
      });
      const userIdByEmail = new Map(existingUsers.map((u) => [u.email, u.id]));
      const existingProfiles = await tx.studentProfile.findMany({
        where: { studentCode: { in: students.map((s) => s.code) } },
        select: { id: true, studentCode: true },
      });
      const profileIdByCode = new Map(existingProfiles.map((p) => [p.studentCode, p.id]));

      for (const s of students) {
        let userId = userIdByEmail.get(s.email);
        if (!userId) {
          userId = randomUUID();
          await tx.user.create({
            data: {
              id: userId,
              email: s.email,
              fullName: s.fullName,
              passwordHash: await passwordHash(),
              isActive: !s.suspended,
              mustChangePassword: false,
            },
          });
          const roleId = randomUUID();
          await tx.userRole.create({ data: { id: roleId, userId, role: 'STUDENT' } });
          manifest.users.push(userId);
          manifest.userRoles.push(roleId);
          added.users++;
          added.userRoles++;
        }
        if (!profileIdByCode.has(s.code)) {
          const profileId = randomUUID();
          await tx.studentProfile.create({
            data: {
              id: profileId,
              userId,
              studentCode: s.code,
              programId,
              curriculumId: curriculum.id,
              admissionYear: s.admissionYear,
              isActive: !s.suspended,
            },
          });
          profileIdByCode.set(s.code, profileId);
          manifest.studentProfiles.push(profileId);
          added.studentProfiles++;
        }
      }

      const existingRecords = await tx.studentCourseRecord.findMany({
        where: { studentProfileId: { in: [...profileIdByCode.values()] }, isActive: true },
        select: { studentProfileId: true, courseId: true, semesterId: true },
      });
      const seen = new Set(existingRecords.map((r) => `${r.studentProfileId}|${r.courseId}|${r.semesterId}`));
      const courseCredits = new Map(courses.map((c) => [c.id, c.credits]));
      const rows = [];
      for (const r of records) {
        const profileId = profileIdByCode.get(r.studentCode)!;
        const semesterId = semesters.get(r.semesterKey)!;
        const key = `${profileId}|${r.courseId}|${semesterId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const id = randomUUID();
        rows.push({ id, grade: r.grade, credits: courseCredits.get(r.courseId)!, studentProfileId: profileId, courseId: r.courseId, semesterId });
        manifest.studentCourseRecords.push(id);
      }
      if (rows.length > 0) await tx.studentCourseRecord.createMany({ data: rows });
      added.studentCourseRecords = rows.length;

      for (const course of missingAssignments) {
        const id = randomUUID();
        await tx.courseInstructor.create({ data: { id, userId: demoInstructor.id, courseId: course.id } });
        manifest.courseInstructors!.push(id);
        added.courseInstructors++;
      }
    },
    { timeout: 180000, maxWait: 30000 },
  );

  mkdirSync(join(__dirname, '..', '.backups'), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log('added rows:', JSON.stringify(added));
  console.log('manifest:', MANIFEST);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
