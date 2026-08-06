# TODO / Known Limitations

## Learning Path Planner — Free Elective/Gen Ed หมวดที่ไม่มี Course catalog เลย

`วิชาเลือกเสรี` (Free Elective) และ Gen Ed บางกลุ่ม (กลุ่มสาระอยู่ดีมีสุข, กลุ่มสาระศาสตร์แห่งผู้ประกอบการ, กลุ่มสาระภาษากับการสื่อสาร, กลุ่มสาระสุนทรียศาสตร์) ไม่มี `Course` row ผูกอยู่เลยตั้งแต่ Phase 4 (เลือกได้ทั้งมหาวิทยาลัย ข้อมูลเยอะเกินจะ import ครบ — ตัดสินใจไว้แล้ว ไม่ใช่ gap ของ Module 9) — `LearningPathService` รายงานได้แค่ "ยังขาดหน่วยกิต X หน่วยกิต" เป็นตัวเลข (`incompleteElectiveCategories` พร้อม `availableElectivesInCategory: []`) ไม่มีทางแนะนำวิชาเฉพาะเจาะจงในหมวดเหล่านี้ได้ และ `nextSemesterPlan` ก็จะไม่มีวันเสนอวิชาจากหมวดนี้ด้วยเหตุผลเดียวกัน (ไม่มี `Course` ให้เลือก) — ถ้าต้องการแก้จริงต้อง import course catalog กลุ่มนี้เพิ่มก่อน ไม่ใช่การแก้ที่ Module 9

## CourseInstructor — Grade Distribution + per-course student list ยังไม่ได้ทำ

รอบนี้ (CourseInstructor mapping + INSTRUCTOR scope) ทำเฉพาะ permission-wiring: เปิด `GET /clo-achievement/course/:id`, `GET /plo-achievement/course/:id`, และ `GET /courses/my-courses` ให้ INSTRUCTOR ที่ได้รับมอบหมายจริงเท่านั้น (`InstructorGuard`) — ยืนยันแล้วว่าเป็นการตัดสินใจที่ตั้งใจ ไม่ใช่ scope ที่ลืม: §9 ยังต้องการ "Grade Distribution" (A/B/C/D/F breakdown เต็ม — `CloAchievementService` มีแค่ %ผ่าน threshold ไม่มี full breakdown) และ "Student ที่เกี่ยวข้อง" (raw student list ต่อ course — `StudentCourseRecordService.findAll` ไม่มี course filter หรือ INSTRUCTOR branch เลย) ทั้งสองเป็น business logic ใหม่ทั้งหมด ไม่ใช่แค่เปิด permission จึงเก็บไว้เป็นรอบถัดไป — ยืนยันอีกครั้งใน Module 10 (Dashboard Endpoints): `GET /dashboard/instructor` เว้น Grade Distribution ไว้ด้วยเหตุผลเดียวกันนี้ (เลือก "เก็บไว้ก่อน" ไม่ bundle เข้ารอบนี้ตาม AskUserQuestion) — `InstructorCourseSummary` มีแค่ `achievementPercent` (% ผ่าน threshold, Phase 8 pass-through) ไม่มี A/B/C/D/F breakdown

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

## Phase 3 — Google OAuth: ยังไม่เคยรัน full end-to-end flow ผ่าน browser จริง

Business logic (`AuthService.handleGoogleCallback`, `completeGoogleRegistration`) ผ่านการทดสอบครบถ้วนแล้วในระดับ unit-level ผ่าน `NestFactory.createApplicationContext` (ไม่ผ่าน HTTP/browser จริง) — ครอบคลุม anti-account-takeover, pending-registration flow, returning-user login, expired token, reused token

แต่ `GET /api/auth/google` (redirect ไป Google) และ `GET /api/auth/google/callback` (Google ส่งกลับมา) **ยังไม่เคยถูกทดสอบจริงเลยสักครั้ง** เพราะยังไม่มี Google Cloud Console credential จริง (`.env` มีแค่ placeholder `change_me_google_client_id` / `change_me_google_client_secret`)

**ก่อน deploy หรือทดสอบผ่าน browser จริง ต้อง:**
1. สมัคร Google Cloud Console project
2. สร้าง OAuth 2.0 Client ID (Web application)
3. ตั้ง Authorized redirect URI ให้ตรงกับ `GET /api/auth/google/callback`
4. ใส่ `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` จริงใน `.env` (แทน placeholder)
5. ทดสอบ full flow ผ่าน browser จริงอีกครั้ง
