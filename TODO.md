# TODO / Known Limitations

## ~~ScopeGuard — Curriculum Content~~ — verified end-to-end

`5b35a6b ScopeGuard: Curriculum Content` (รอบก่อนหน้า) ต่อ `ScopeGuard`/`ScopeResolverService.resolveAncestry` เข้า `Curriculum`/`Course`/`Clo`/`Plo`/`CourseCategory`/`CurriculumRequirement`/`Prerequisite`/`CloPloMapping` ครบแล้ว แต่ไม่เคยมีการทดสอบ end-to-end ด้วยข้อมูลจริงมาก่อน — ทดสอบวันที่ 2026-08-07 ด้วยข้อมูล ICT จริง (program `เทคโนโลยีสารสนเทศและการสื่อสาร`, curriculum 2564, course `01999111`, สร้าง CLO/PLO ทดสอบชั่วคราวแล้วลบทิ้ง) ผ่าน HTTP จริงกับ dev server (ไม่ใช่เรียก service ตรง):

- SUPER_ADMIN bypass ผ่าน (200)
- ADMIN scope ระดับ FACULTY เข้าถึง curriculum/course/clo/plo ที่อยู่ลึกลงไปหลายชั้นใต้ faculty เดียวกันได้ครบ (hierarchical inheritance ทำงานถูกต้อง — ทดสอบผ่าน HTTP จริง ไม่ใช่แค่ unit test)
- ADMIN scope ระดับ PROGRAM ที่ผูกกับ program อื่น (การตลาด) ถูกปฏิเสธครบทั้ง 4 endpoint (403)
- STAFF scope ระดับ FACULTY เข้าถึง course ได้ (200) แต่ถูกบล็อก clo/plo (403) — ยืนยันว่าเป็นการบล็อกจาก `RolesGuard` (role ไม่อยู่ใน `@Roles`) ไม่ใช่จาก scope ไม่ครอบคลุม ตรงตามที่ตั้งใจออกแบบไว้

ไม่มีจุดใดต้องแก้โค้ด — ยืนยันว่า implementation ที่มีอยู่ถูกต้องครบถ้วน

## ⚠️ OTP verification ถูกปิดชั่วคราวทั้งระบบ (register + login) — ต้องเปิดกลับก่อนใช้งานจริง

`AuthService` (`apps/backend/src/modules/auth/auth.service.ts`) มี constant `SKIP_OTP_VERIFICATION = true` อยู่ด้านบนไฟล์ (เดิมชื่อ `SKIP_REGISTRATION_OTP`, เปลี่ยนชื่อ+ขยายขอบเขตแล้ว) — ตอนนี้ทั้ง `POST /auth/register` **และ** `POST /auth/login` จะออก token ทันที (`accessToken`/`refreshToken` cookie) แทนที่จะส่ง OTP ไปยืนยันอีเมลก่อนเหมือนที่ออกแบบไว้เดิม เพื่อให้คนอื่นทดลองใช้งานระบบได้ง่ายขึ้นโดยไม่ต้องเข้าถึงอีเมลจริง

**ไม่ได้ลบ `OtpService`/`OtpCode` model ทิ้ง** — แค่ short-circuit 2 จุดเรียกใช้ใน `register()`/`login()` (`verify-otp` endpoint ยังอยู่ครบ เผื่อเปิดกลับ) เปิดกลับมาได้ทันทีด้วยการเปลี่ยน `SKIP_OTP_VERIFICATION` เป็น `false` — ไม่ต้องแก้ที่อื่นเลยทั้ง backend/frontend เพราะทั้งคู่เช็ค response shape (`'accessToken' in data`) รองรับทั้ง 2 สถานะของ flag อยู่แล้ว

**ความเสี่ยงขณะเปิด flag นี้ไว้**: ใครก็ได้สามารถสมัครสมาชิกหรือ login ด้วยอีเมลที่ตัวเองไม่ได้เป็นเจ้าของ แล้วเข้าใช้งานได้ทันทีโดยไม่มีการพิสูจน์ความเป็นเจ้าของอีเมลเลยทั้งระบบ (ไม่ใช่แค่ตอนสมัครสมาชิกอีกต่อไป) — **ต้องเปิด OTP กลับมาก่อนใช้งานจริงกับข้อมูลนักศึกษาจริงเด็ดขาด**

## Curriculum.isOpenForRegistration — field มีอยู่ใน schema แต่ไม่ถูก enforce ที่ไหนเลย

`Curriculum.isOpenForRegistration` มีอยู่ในสคีมาตั้งแต่ Phase 4 (มี logic `unsetOtherOpenCurricula` ตอน create/update เพื่อกันไม่ให้มีมากกว่า 1 หลักสูตรเปิดพร้อมกันต่อ program) แต่ตรวจสอบแล้วว่า **ไม่มีจุดไหนอ่านค่านี้เพื่อบังคับใช้จริงเลย** ทั้งฝั่ง backend (`AuthService.register`/`StudentProfileService` ไม่เช็คเลยตอนสมัครสมาชิก) และ frontend (เคยลองกรอง dropdown ด้วย field นี้ใน `DependentOrgSelect` ตอน Frontend F1 แล้วพบว่าใช้งานไม่ได้จริง — ข้อมูลจริงทุกแถว (16 หลักสูตร) เป็น `false` หมด ทำให้ dropdown ว่างเปล่าเสมอ จึงเอา filter ออกแล้ว หันไปกรองด้วย `isActive`+`programId` แทน ซึ่งตรงกับสิ่งที่ backend ยอมรับจริง)

**ต้องตัดสินใจ**: จะ implement การ enforce จริง (เช่น backend เช็คตอน register ว่า curriculum ที่เลือกต้อง `isOpenForRegistration: true`, มี endpoint ให้ ADMIN เปิด/ปิดรอบรับสมัครต่อหลักสูตร) หรือถือว่าเป็น field ที่ยังไม่ได้ใช้งานจริงในตอนนี้ (มีไว้เผื่ออนาคต ไม่ใช่ bug ที่ต้องรีบแก้) — ยังไม่ได้ตัดสินใจ

## StudentCourseRecord audit trail — soft-delete ไม่รู้จัก unique constraint

เพิ่ม `isActive`/`enteredByUserId`/`enteredByRole` เข้า `StudentCourseRecord` (ตามหลัง STAFF write access round) — ADMIN/STAFF ลบ record ของนักศึกษาคนอื่นเป็น soft-delete (`isActive: false`), STUDENT ลบของตัวเอง/SUPER_ADMIN ยังเป็น hard-delete เหมือนเดิม

**ข้อจำกัดที่ยอมรับไว้**: `@@unique([studentProfileId, courseId, semesterId])` ไม่รู้จัก `isActive` — แถวที่ถูก soft-delete ยังคงครอบครอง slot ของ unique key นั้นอยู่ ถ้า ADMIN/STAFF soft-delete แถวผิดพลาดแล้วพยายามสร้างแถวใหม่สำหรับนักศึกษา+วิชา+เทอมเดียวกัน จะเจอ 409 Conflict จนกว่าจะจัดการแถวเดิมจริงๆ (ไม่มี endpoint สำหรับ hard-delete/restore แถวที่ soft-delete แล้วในตอนนี้) — ไม่ใช่ปัญหาสำหรับกรณีทั่วไป "เกรดผิด แก้เกรด" เพราะใช้ `PATCH` ได้ตรงๆ ไม่ต้องลบ+สร้างใหม่ กระทบเฉพาะกรณี "ทั้ง registration ผิด" ซึ่งพบไม่บ่อย ถ้าต้องแก้จริงต้องออกแบบ unique constraint ใหม่ (เช่น partial unique index ที่กรอง `isActive: true`) เป็นการตัดสินใจ scope ใหม่

## STAFF role (§10) — "Course Offering" ไม่มี model, CLO/PLO ยืนยันว่าตั้งใจไม่ให้ STAFF เข้าถึง

รอบนี้เปิด STAFF permission ครบตาม §10 เท่าที่มี endpoint จริงรองรับ: Student data (`GET /student-profiles`, `GET /student-profiles/:id` — endpoint ใหม่, scoped), Grades (`StudentCourseRecord` ทั้ง 6 route — เพิ่ม ADMIN/STAFF-with-scope, STUDENT self-write เดิมไม่แตะ), Course master data (`Course`/`CourseCategory`/`CurriculumRequirement`/`Prerequisite`), Instructor Assignment (`CourseInstructor`)

**"Course Offering" ไม่มี model**: §10 พูดถึง "Course Offering" เป็นความรับผิดชอบของ STAFF แต่ไม่มี concept/model นี้อยู่ในระบบเลย (ไม่ใช่ gap ของรอบนี้ — เหมือน Learning Path's Free Elective gap ที่ตัดสินใจไว้แล้วว่าไม่ใช่ปัญหา permission) ตัวที่ใกล้เคียงที่สุดที่มีอยู่คือ `StudentCourseRecord` (course+semester ผูกกันโดยนัยผ่านการลงทะเบียนแต่ละคน) กับ `CourseInstructor` (การมอบหมายแบบถาวร ไม่ผูกเทอม) — ถ้าต้องการ "Course Offering" จริงต้องออกแบบ model ใหม่ เป็นการตัดสินใจ scope ใหม่

**CLO/PLO/CloPloMapping ยืนยันว่าไม่เปิดให้ STAFF**: §10 ระบุชัดว่า "STAFF ไม่ควรมีสิทธิ์แก้ CLO/PLO เพียงเพราะเป็น STAFF" — ตรวจสอบแล้วว่า `Clo`/`Plo`/`CloPloMapping` controller ยังคงเป็น `@Roles('SUPER_ADMIN', 'ADMIN')` เท่านั้น ไม่ถูกแตะในรอบนี้ ตรงตาม requirement

`AcademicYear`/`Semester`: GET เปิดให้ทุก role ที่ login แล้วอยู่ก่อนแล้ว (ไม่มี `@Roles` เลยบน route GET) จึง STAFF อ่านได้อยู่แล้วโดยไม่ต้องแก้โค้ด — POST/PATCH/DELETE ยังคง SUPER_ADMIN-only ตามที่ตัดสินใจไว้ (global master data ไม่มี scope ให้จำกัด STAFF)

## Module 7 — AI Skill Analysis: ไม่มี caching/persistence, ต้องการ `ANTHROPIC_API_KEY` จริงก่อนใช้งาน

`AiAnalysisService.getStudentAnalysis` เรียก Anthropic API สดทุก request ไม่มี cache หรือ persist ผลลัพธ์ไว้เลย (ตัดสินใจไว้แล้วผ่าน AskUserQuestion — เพื่อลดขอบเขต ไม่เพิ่ม model/migration ใหม่รอบนี้) ผลคือทุก request ที่มีข้อมูลเกรดจริงจะมีค่าใช้จ่าย + latency ของ AI call เต็มจำนวน ไม่ต่างจาก endpoint อื่นที่คำนวณสดฟรี — ถ้า cost/latency กลายเป็นปัญหาจริงใน production ต้องออกแบบ persistence layer (เช่น `AiSkillAnalysisSnapshot` model + invalidate เมื่อข้อมูลอ้างอิงเปลี่ยน) เป็นการตัดสินใจ scope ใหม่ ไม่ใช่รอบนี้

`.env`/`.env.example` มีแค่ placeholder `ANTHROPIC_API_KEY=change_me_anthropic_api_key` — ต้องใส่ key จริงก่อนเรียก endpoint นี้ได้ ไม่งั้นทุก request จะได้ 503 (AI provider ปฏิเสธ key ปลอม)

Dashboard's `aiSummary` (Student Dashboard, §29) และ `aiCurriculumSummary` (Curriculum Dashboard, §31) ยังคงเป็น `null` โดยตั้งใจ — `DashboardModule` ไม่ได้เรียก `AiAnalysisService` เลยรอบนี้ (ตัดสินใจไว้แล้ว: standalone endpoint เท่านั้น เพื่อให้ Dashboard endpoints ทั้งหมดยังคงเร็ว/ฟรีเหมือนเดิม ไม่มี AI call แฝงอยู่) frontend ต้องเรียก `GET /ai-analysis/student/:id` แยกต่างหาก (เช่น ปุ่ม "วิเคราะห์ด้วย AI") ไม่ใช่ bug ที่ Dashboard ลืมใส่ค่า — และยังไม่มี curriculum-level AI endpoint เลยด้วย (`aiCurriculumSummary` ไม่มีทางเติมได้ในตอนนี้)

## Learning Path Planner — Free Elective/Gen Ed หมวดที่ไม่มี Course catalog เลย

`วิชาเลือกเสรี` (Free Elective) และ Gen Ed บางกลุ่ม (กลุ่มสาระอยู่ดีมีสุข, กลุ่มสาระศาสตร์แห่งผู้ประกอบการ, กลุ่มสาระภาษากับการสื่อสาร, กลุ่มสาระสุนทรียศาสตร์) ไม่มี `Course` row ผูกอยู่เลยตั้งแต่ Phase 4 (เลือกได้ทั้งมหาวิทยาลัย ข้อมูลเยอะเกินจะ import ครบ — ตัดสินใจไว้แล้ว ไม่ใช่ gap ของ Module 9) — `LearningPathService` รายงานได้แค่ "ยังขาดหน่วยกิต X หน่วยกิต" เป็นตัวเลข (`incompleteElectiveCategories` พร้อม `availableElectivesInCategory: []`) ไม่มีทางแนะนำวิชาเฉพาะเจาะจงในหมวดเหล่านี้ได้ และ `nextSemesterPlan` ก็จะไม่มีวันเสนอวิชาจากหมวดนี้ด้วยเหตุผลเดียวกัน (ไม่มี `Course` ให้เลือก) — ถ้าต้องการแก้จริงต้อง import course catalog กลุ่มนี้เพิ่มก่อน ไม่ใช่การแก้ที่ Module 9

## ~~CourseInstructor — Grade Distribution + per-course student list~~ — resolved

รอบนี้ (CourseInstructor mapping + INSTRUCTOR scope) ทำเฉพาะ permission-wiring: เปิด `GET /clo-achievement/course/:id`, `GET /plo-achievement/course/:id`, และ `GET /courses/my-courses` ให้ INSTRUCTOR ที่ได้รับมอบหมายจริงเท่านั้น (`InstructorGuard`) — ยืนยันแล้วว่าเป็นการตัดสินใจที่ตั้งใจ ไม่ใช่ scope ที่ลืม: §9/§30 ยังต้องการ "Grade Distribution" (A/B/C/D/F breakdown เต็ม) และ "Student ที่เกี่ยวข้อง" (raw student list ต่อ course — `StudentCourseRecordService.findAll` ไม่มี course filter หรือ INSTRUCTOR branch เลย) ทั้งสองเป็น business logic ใหม่ทั้งหมด ไม่ใช่แค่เปิด permission จึงเก็บไว้เป็นรอบถัดไป — ยืนยันอีกครั้งใน Module 10 (Dashboard Endpoints): `GET /dashboard/instructor` เว้น Grade Distribution ไว้ด้วยเหตุผลเดียวกันนี้ (เลือก "เก็บไว้ก่อน" ไม่ bundle เข้ารอบนั้นตาม AskUserQuestion)

**Grade Distribution ปิดแล้ว**: `InstructorCourseSummary.gradeDistribution` (`GET /dashboard/instructor`) เพิ่ม full tally ทั้ง 12 ค่าของ `Grade` enum (A/B_PLUS/B/C_PLUS/C/D_PLUS/D/F/W/I/S/U) ผ่าน `StudentCourseRecordService.tallyGradeDistribution` ใหม่ (pure helper ทำงานบน `getLatestAttemptsPerStudent(courseId)` ที่มีอยู่แล้ว) — `achievementPercent` ข้างๆ กันเป็น "% B ขึ้นไป" อยู่แล้วตั้งแต่ Phase 8 (pass-through ของ `CloAchievementService`) ไม่ต้องแก้เพิ่ม

**"Student ที่เกี่ยวข้อง" ปิดแล้ว**: `GET /courses/:courseId/students` (endpoint ใหม่ — คนละ path จาก `StudentCourseRecordService.findAll`, ไม่ได้แก้ endpoint เดิม) คืน roster ขั้นต่ำ (`studentProfileId`/`studentCode`/`fullName`/`grade` ล่าสุด — ไม่มี email/ข้อมูลติดต่ออื่น) ผ่าน `StudentCourseRecordService.getStudentRosterForCourse` ใหม่ ซึ่ง reuse `getLatestAttemptsPerStudent(courseId)` เดิม (ตัวเดียวกับ Grade Distribution) — permission ใช้ `InstructorOrScopeGuard` (`SUPER_ADMIN`/`ADMIN`-with-scope/`INSTRUCTOR`-assigned) อยู่ในไฟล์ใหม่ `course-students.controller.ts` ที่ลงทะเบียนใน `StudentCourseRecordModule` (ไม่ใช่ `CourseModule`/`CourseController` — เพื่อเลี่ยง circular import เพราะ `StudentCourseRecordModule` import `CourseModule` อยู่แล้ว)

## Auth gaps closure — forgot-password email เป็น mock log เหมือน OTP/invitation

`PasswordResetService.create` ไม่ได้ส่งอีเมลจริง — log ผ่าน `console.warn('[PASSWORD RESET MOCK] ...')` เท่านั้น เป็น pattern เดียวกับ OTP/invitation ที่บันทึกไว้แล้ว ไม่ใช่ gap ใหม่ — ทั้งสามจุด (OTP, invitation, password reset) ต้องรอ real email service ตัวเดียวกันก่อน deploy จริง

## Module 12 — User Management: invitation email เป็น mock log เหมือน OTP

`PendingInvitationService.create`/`resend` ไม่ได้ส่งอีเมลจริง — log ผ่าน `console.warn('[INVITE MOCK] ...')` เท่านั้น เป็น gap เดียวกับที่บันทึกไว้แล้วสำหรับ OTP (`OtpService`) และ Google OAuth credential (ดูหัวข้อด้านล่าง) — ต้องมี real email service ก่อน deploy จริง ไม่ใช่ปัญหาใหม่ที่ต้องแก้แยก แค่ยืนยันว่าเป็น pattern เดียวกันที่ยังไม่ปิด

## ~~ScopeGuard — global `AllExceptionsFilter`~~ — resolved

~~CONVENTIONS.md §4 gap~~ — closed: `AllExceptionsFilter` now exists (`src/common/filters/all-exceptions.filter.ts`, registered via `APP_FILTER` in `app.module.ts`), normalizes Prisma `P2025`/`P2002`/`P2003` + unknown errors, passes through existing `HttpException`s unchanged (regression-tested against `FacultyService.remove()`'s `ConflictException`). A full-codebase audit for `findUniqueOrThrow`/`findFirstOrThrow` found exactly one occurrence (`CreditCheckerService.loadCurriculumTree`), already guarded upstream by callers — not a live risk, but not fixed to the `findUnique`+null-check style either; low priority since the filter is now a safety net regardless.

**Not yet audited** (out of scope of that pass): ~32 raw `.update()`/`.delete()` calls (not `updateMany`/`deleteMany`) across the codebase that could theoretically throw `P2025` under a race condition — the new `AllExceptionsFilter` now catches these safely as 404 either way, so this is no longer urgent, just unverified whether each one *also* has its own explicit guard upstream (belt-and-suspenders, not required for correctness anymore).

## Phase 9 Chunk 4 — Curriculum Analytics: N₂ query ต่อวิชาสำหรับ Course Analytics/Lowest CLO

`PloAchievementService.calculateForCurriculum` วน `CloAchievementService.calculateForCourse(courseId)` ทีละวิชาสำหรับทุกวิชา active ในหลักสูตร (N₂ queries สำหรับ N₂ วิชา, แต่ละครั้งมี ~4 query ย่อยภายใน) เพื่อสร้าง `courseAnalytics` และหา `lowestClos` — เป็นคนละ data shape จาก student loop ข้างบน (ไม่ share query ได้) นอกจากนี้ `CloAchievementService.calculateForCourse` เองยัง re-validate curriculum เดิมซ้ำทุกครั้งที่เรียกภายใน loop นี้ (inefficiency เดิมของ Phase 8 ไม่ใช่สิ่งที่ Chunk 4 ควรข้ามไปเพราะกฎ "reuse ไม่ duplicate logic") — ข้อมูลจริงตอนนี้มีวิชาต่อหลักสูตรไม่มาก (~50 วิชา) จึงยอมรับ N₂ queries ไปก่อน เหมือน pattern เดียวกับ Chunk 3's N-query note ด้านล่าง

## Phase 9 Chunk 3 — Cohort Analytics: N query ต่อ cohort (ไม่มี bulk query)

`PloAchievementService.calculateForCohort` เรียก `StudentCourseRecordService.getLatestAttemptsPerCourse(studentProfileId)` วนทีละคนต่อนักศึกษาในกลุ่ม (N queries สำหรับ N นักศึกษา) เพราะยังไม่มี method แบบ "ดึง latest attempt ของหลายนักศึกษาข้ามหลายวิชาในคำสั่งเดียว" — ข้อมูลจริงตอนนี้มีนักศึกษาต่อ cohort ไม่มาก จึงยอมรับ N queries ไปก่อน ถ้าในอนาคตจำนวนนักศึกษาต่อ cohort มากขึ้นจนเป็นปัญหาจริง ค่อยออกแบบ bulk method ใหม่ (query เดียว group by studentProfileId ในหน่วยความจำ) — ไม่ใช่การ optimize ล่วงหน้าที่ควรทำตอนนี้

## Phase 8 — CLO Achievement: ไม่มี CLO-specific grade breakdown ใน schema

CLO Achievement ใช้ grade รวมทั้งวิชาตัดสินทุก CLO เท่ากัน (ไม่มี CLO-specific grade breakdown ใน schema ปัจจุบัน) — ถ้าต้องการความแม่นยำกว่านี้ในอนาคต (เช่น แยกคะแนนต่อ CLO จาก assignment/exam breakdown) ต้องออกแบบ schema ใหม่ (เช่น `CloScore` ผูกกับ `StudentCourseRecord`+`Clo`) เป็นการตัดสินใจ scope ใหม่ ไม่ใช่ Phase 8 ปัจจุบัน

## ~~Phase 3 — Google OAuth: ยังไม่เคยรัน full end-to-end flow ผ่าน browser จริง~~ — resolved

ทดสอบผ่าน browser จริงสำเร็จแล้ววันที่ 2026-08-07 ด้วย Google Cloud Console credential จริง (`.env` มี `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` ที่ตรงกับ `GET /api/auth/google/callback` แล้ว ไม่ใช่ placeholder อีกต่อไป) ครอบคลุม:
- `GET /api/auth/google` → redirect ไป Google จริง → `GET /api/auth/google/callback` ได้ `pendingToken`/`isNewUser: true` สำหรับบัญชีใหม่
- `POST /api/auth/google/complete-registration` ด้วย `pendingToken` จริง + studentCode/programId/curriculumId/admissionYear → ได้ `accessToken`/`refreshToken` ทันที ไม่ต้องผ่าน OTP (ตามที่ออกแบบไว้ — Google ถือว่ายืนยันตัวตนพอแล้ว)
- ยืนยันด้วย DB query ว่า `User`+`UserAuthMethod(GOOGLE)`+`UserRole(STUDENT)`+`StudentProfile` ถูกสร้างครบในรอบเดียว
- Returning-user path (`handleGoogleCallback` เรียกตรงผ่าน `NestFactory.createApplicationContext` ด้วย googleId เดิมที่ผูกไว้แล้ว — เข้า browser ซ้ำรอบสองทำไม่ได้จริงในการทดสอบอัตโนมัติ แต่ business logic เส้นนี้เหมือนกันกับที่ unit-test ไว้แล้ว) → ออก `accessToken`/`refreshToken` ทันที ไม่มี `pendingToken` ซ้ำ ตรงตามที่ออกแบบไว้

Business logic อื่นๆ (anti-account-takeover, expired/reused token) ผ่านการทดสอบ unit-level ไว้ตั้งแต่ก่อนหน้านี้แล้ว ไม่ได้ทดสอบซ้ำรอบนี้ ไม่ใช่ gap ใหม่
