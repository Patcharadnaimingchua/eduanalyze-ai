# TODO / Known Limitations

## Learning Path Planner — รองรับ touch/มือถือผ่านปุ่ม tap ไม่ใช่การลาก (สร้าง 2026-08-12)

`/learning-path`'s `DragDropPlanner` (`apps/frontend/src/components/learning-path/drag-drop-planner.tsx`, `course-drag-card.tsx`) ใช้ native HTML5 Drag and Drop API เป็นหลัก (ไม่มี dnd library ใน dependency) — **native drag ไม่ทำงานบน touch device เลย** (ข้อจำกัดจริงของ spec) แต่ทุกการ์ดมีปุ่ม "ย้ายเข้าแผน"/"เอาออกจากแผน" แสดงตลอดเวลา (ไม่ใช่แค่ตอน detect touch เพราะ detect ผิดพลาดได้) ที่เรียก state setter (`moveToPlan`/`moveToOthers`) ตัวเดียวกับที่ drop event ใช้ — **ใช้งานได้ครบทุก device ผ่านปุ่มนี้แม้ลากไม่ได้เลย** ไม่ต้อง duplicate state

Persistence เป็น client-side state ล้วน (`useState`, reset เมื่อ reload) ตามเจตนาที่ตั้งใจ ("ลองวางแผนดูก่อนตัดสินใจ") — backend ไม่มี endpoint บันทึกแผนที่ปรับเอง ปุ่ม "รีเซ็ตเป็นแผนที่แนะนำ" แทนที่คำว่า "Commit" เดิม เพราะไม่มี REG integration/backend save จริง

## PLO/CLO/CloPloMapping — sample data ครอบคลุมแค่ 24/96 วิชา (สร้าง 2026-08-11)

`apps/backend/prisma/seed-plo-clo.ts` (สคริปต์ถาวร, รันซ้ำได้แบบ idempotent ผ่าน `npm run prisma:seed:plo-clo --workspace=apps/backend`) สร้าง PLO 6 ด้าน × 2 curriculum (ICT 2564 + 2569) = 12 แถวจริงตาม PROJECT_CONTEXT.md §20 ตรงตัว — **ส่วนนี้เป็นข้อมูลจริง**

แต่ **CLO (26 ข้อ/curriculum, รวม 52) และ CloPloMapping (~40-41/curriculum, รวม 81) เป็น sample/demo data** ที่แต่งขึ้นเองจากชื่อวิชาเท่านั้น ไม่ใช่ CLO จริงที่ผ่านการอนุมัติจากหลักสูตร — เหตุผล: `Course.description` เป็น `NULL` ทุกแถวทั้ง 96 วิชา (Phase 4 import ไม่เคยพา description มาด้วย) จึงไม่มีเอกสารต้นทางให้อิงเหมือนตอน import Course

ครอบคลุมแค่ **12 วิชาบังคับต่อ curriculum (รวม 24/96 วิชา)** ที่กระจายครบ 5 หมวดหลัก (พื้นฐาน/ประเด็นองค์การ/เทคโนโลยีประยุกต์/ซอฟต์แวร์/โครงสร้างพื้นฐาน) — วิชาที่เหลืออีก ~72 วิชา (รวมวิชาเลือกทั้งหมดและ gen-ed) **ยังไม่มี CLO เลย** ฝั่ง frontend (Course Assessment, PLO radar) ต้อง handle กรณีไม่มี CLO อยู่แล้วตามที่ทดสอบไว้

**ถ้าจะขยายให้ครบทุกวิชาในอนาคต**: เพิ่ม `CourseCloSeed` entry ใหม่ใน `seed-plo-clo.ts` ตาม pattern เดิม (2-3 CLO ต่อวิชา, weight 1-5 ตามเกณฑ์ในไฟล์) หรือแทนที่ด้วย CLO จริงจากเอกสารหลักสูตรถ้ามี — แนะนำให้ replace เป็นชุดจริงทันทีที่มีเอกสารอนุมัติจริง เพราะ Achievement/PLO radar/Course Assessment ทั้งระบบพึ่งข้อมูลชุดนี้โดยตรง

## /aptitude-analysis ใช้ข้อความสรุปแบบ rule-based แทน AI จริง (ตัดสินใจแล้ว 2026-08-08)

หน้า `วัดความถนัด` (`apps/frontend/src/app/aptitude-analysis/page.tsx`) **ไม่เรียก `GET /ai-analysis/student/:id` อีกต่อไป** — เปลี่ยนเป็นสร้างข้อความสรุป (`summary`/`strengths`/`weaknesses`/`recommendations`) แบบ deterministic 100% จากตัวเลข PLO จริงที่มีอยู่แล้ว (`apps/frontend/src/lib/interpret-plo-radar.ts`) เพื่อไม่ต้องเสียค่าใช้จ่ายเรียก Anthropic ทุกครั้งที่เปิดหน้า

**Backend `AiAnalysisService`/`GET /ai-analysis/student/:id` ยังอยู่ครบ ไม่ได้แตะ** — ยังเรียกตรงได้ผ่าน Swagger เหมือนเดิมถ้าต้องการ ส่วน `apps/frontend/src/lib/api/ai-analysis.ts` (`fetchAiSkillAnalysis`) ก็ยังอยู่ในโค้ดแต่ไม่มีจุดไหนเรียกใช้แล้ว — **ถ้าจะเปิดกลับมาใช้ AI จริงในอนาคต** (เช่น มี `ANTHROPIC_API_KEY` จริงแล้วและยอมรับค่าใช้จ่าย): แก้ `app/aptitude-analysis/page.tsx` ให้กลับไปเรียก `fetchAiSkillAnalysis` แทน `interpretPloRadar` (import `PloInterpretationCard`'s เดิมที่ชื่อ `AiInterpretationCard` ถูกลบไปแล้ว ต้องสร้าง/ปรับ component ให้รองรับ async state อีกครั้งหรือ mix ทั้งสองแบบก็ได้)

## Credit Checker — `isPrerequisiteSatisfied` เคยเป็นแค่ boolean (แก้แล้ว 2026-08-12)

**แก้แล้ว**: `CourseSummary` (backend + shared-types) เพิ่ม `prerequisiteCourseIds: string[]` (raw edge, ทุกวิชา ไม่ใช่แค่ `missingRequiredCourses`) คู่กับ `isPrerequisiteSatisfied` — ตอนนี้ frontend เดารายชื่อ prerequisite ที่ขาดได้จริงจาก `prerequisiteCourseIds` โดยไม่ต้อง fetch เพิ่ม (ใช้ใน Prerequisite Flow Chart, `/credit-checker`) ไม่ต้องแก้ backend เพิ่มสำหรับ use case นี้แล้ว

**สี node ทั้ง 4 สถานะ (เขียว/ฟ้า/เทา/ส้ม) ยืนยันแล้วว่าแสดงผลถูกต้องจริงในเบราว์เซอร์ (2026-08-12)** — ตอน implement มีรอบ debug ว่าสีไม่ขึ้นเลย ตรวจ source/CSS/build ครบไม่พบบั๊กในโค้ด (ทุก class ถูก generate ถูกต้องใน `layout.css`) สรุปว่าเป็น browser cache ค้าง ไม่ใช่บั๊ก — ผู้ใช้ยืนยันแล้วว่า hard refresh แก้ปัญหาได้จริง

## ~~ไม่มีหน้า ADMIN สำหรับจัดการ AcademicYear/Semester~~ — แก้แล้ว (2026-08-25)

**แก้แล้ว**: `apps/frontend/src/app/admin/academic-years/page.tsx` (SUPER_ADMIN only) — create+soft-delete ทั้งปีการศึกษาและภาคเรียนผ่าน UI จริงแล้ว ทดสอบ end-to-end ผ่านเบราว์เซอร์แล้ว (create, duplicate-year 409, add/delete semester, delete year, role-block) ดูรายละเอียดที่ `apps/frontend/FRONTEND_STATUS.md` หมวด ADMIN

ยังไม่มี UI สำหรับแก้ไข (edit) ปี/เทอมที่มีอยู่แล้ว (แค่ create+delete) — backend มี PATCH endpoint รองรับอยู่แล้ว เพิ่ม UI ทีหลังได้ถ้าจำเป็นจริง ไม่ใช่ blocker สำหรับ pilot รอบนี้

## ~~ScopeGuard — Curriculum Content~~ — verified end-to-end

`5b35a6b ScopeGuard: Curriculum Content` (รอบก่อนหน้า) ต่อ `ScopeGuard`/`ScopeResolverService.resolveAncestry` เข้า `Curriculum`/`Course`/`Clo`/`Plo`/`CourseCategory`/`CurriculumRequirement`/`Prerequisite`/`CloPloMapping` ครบแล้ว แต่ไม่เคยมีการทดสอบ end-to-end ด้วยข้อมูลจริงมาก่อน — ทดสอบวันที่ 2026-08-07 ด้วยข้อมูล ICT จริง (program `เทคโนโลยีสารสนเทศและการสื่อสาร`, curriculum 2564, course `01999111`, สร้าง CLO/PLO ทดสอบชั่วคราวแล้วลบทิ้ง) ผ่าน HTTP จริงกับ dev server (ไม่ใช่เรียก service ตรง):

- SUPER_ADMIN bypass ผ่าน (200)
- ADMIN scope ระดับ FACULTY เข้าถึง curriculum/course/clo/plo ที่อยู่ลึกลงไปหลายชั้นใต้ faculty เดียวกันได้ครบ (hierarchical inheritance ทำงานถูกต้อง — ทดสอบผ่าน HTTP จริง ไม่ใช่แค่ unit test)
- ADMIN scope ระดับ PROGRAM ที่ผูกกับ program อื่น (การตลาด) ถูกปฏิเสธครบทั้ง 4 endpoint (403)
- STAFF scope ระดับ FACULTY เข้าถึง course ได้ (200) แต่ถูกบล็อก clo/plo (403) — ยืนยันว่าเป็นการบล็อกจาก `RolesGuard` (role ไม่อยู่ใน `@Roles`) ไม่ใช่จาก scope ไม่ครอบคลุม ตรงตามที่ตั้งใจออกแบบไว้

ไม่มีจุดใดต้องแก้โค้ด — ยืนยันว่า implementation ที่มีอยู่ถูกต้องครบถ้วน

## ~~OTP verification ถูกปิดชั่วคราวทั้งระบบ~~ — ลบ OTP ออกจากระบบทั้งหมดแล้ว (2026-08-25)

**ตัดสินใจแล้ว**: ระบบเปลี่ยนจาก 2-factor (email+password+OTP) เป็น 1-factor (email+password เท่านั้น) อย่างถาวร — ไม่ใช่แค่ปิด flag อีกต่อไป

ลบออกจริง: `SKIP_OTP_VERIFICATION` constant, `OtpService`, `dto/verify-otp.dto.ts`, `POST /auth/verify-otp` endpoint, `OtpCode` model + `OtpPurpose` enum (migration `20260825150029_remove_otp_verification` DROP table จริง), หน้า frontend `/verify-otp`, `otpCodeSchema` — `register()`/`login()` ตอนนี้ออก token ทันทีเสมอ ไม่มี branch แยกอีกแล้ว

**ไม่กระทบ**: Google OAuth (ไม่เคยผ่าน OTP อยู่แล้วตั้งแต่ Phase 3), `PasswordResetToken`/forgot-password flow (คนละ table กับ `OtpCode` โดยสิ้นเชิง)

## Curriculum.isOpenForRegistration — field มีอยู่ใน schema แต่ไม่ถูก enforce ที่ไหนเลย

`Curriculum.isOpenForRegistration` มีอยู่ในสคีมาตั้งแต่ Phase 4 (มี logic `unsetOtherOpenCurricula` ตอน create/update เพื่อกันไม่ให้มีมากกว่า 1 หลักสูตรเปิดพร้อมกันต่อ program) แต่ตรวจสอบแล้วว่า **ไม่มีจุดไหนอ่านค่านี้เพื่อบังคับใช้จริงเลย** ทั้งฝั่ง backend (`AuthService.register`/`StudentProfileService` ไม่เช็คเลยตอนสมัครสมาชิก) และ frontend (เคยลองกรอง dropdown ด้วย field นี้ใน `DependentOrgSelect` ตอน Frontend F1 แล้วพบว่าใช้งานไม่ได้จริง — ข้อมูลจริงทุกแถว (16 หลักสูตร) เป็น `false` หมด ทำให้ dropdown ว่างเปล่าเสมอ จึงเอา filter ออกแล้ว หันไปกรองด้วย `isActive`+`programId` แทน ซึ่งตรงกับสิ่งที่ backend ยอมรับจริง)

**ต้องตัดสินใจ**: จะ implement การ enforce จริง (เช่น backend เช็คตอน register ว่า curriculum ที่เลือกต้อง `isOpenForRegistration: true`, มี endpoint ให้ ADMIN เปิด/ปิดรอบรับสมัครต่อหลักสูตร) หรือถือว่าเป็น field ที่ยังไม่ได้ใช้งานจริงในตอนนี้ (มีไว้เผื่ออนาคต ไม่ใช่ bug ที่ต้องรีบแก้) — ยังไม่ได้ตัดสินใจ

## ~~StudentCourseRecord audit trail — soft-delete ไม่รู้จัก unique constraint~~ — แก้แล้ว (2026-08-26)

เพิ่ม `isActive`/`enteredByUserId`/`enteredByRole` เข้า `StudentCourseRecord` (ตามหลัง STAFF write access round) — ADMIN/STAFF ลบ record ของนักศึกษาคนอื่นเป็น soft-delete (`isActive: false`), STUDENT ลบของตัวเอง/SUPER_ADMIN ยังเป็น hard-delete เหมือนเดิม

**แก้แล้ว**: เปลี่ยน `@@unique([studentProfileId, courseId, semesterId])` (Prisma schema-level, ไม่รู้จัก `isActive`) เป็น partial unique index จริงใน Postgres (`CREATE UNIQUE INDEX ... WHERE "isActive" = true`, migration `20260826042955_add_student_course_record_partial_unique_index`) — Prisma ไม่มี syntax แบบ schema-level สำหรับ filtered unique index จึงต้องเขียน raw SQL เอง และลบ `@@unique(...)` ออกจาก `schema.prisma` (มี comment อธิบายไว้ในไฟล์ว่าทำไม + เตือนว่า `prisma migrate dev` รอบถัดไปจะไม่เห็น index นี้และอาจเสนอ DROP เป็น drift — ต้อง review ด้วย `--create-only` เสมอ) Service layer (`create()`'s P2002 → 409 catch) ไม่ต้องแก้อะไรเลย เพราะ Postgres ยัง raise unique-violation error code เดิมไม่ว่า index จะเป็น partial หรือไม่ ทดสอบ reproduce บั๊กจริงก่อนแก้ (soft-delete แล้วสร้างใหม่ → 409) แล้วยืนยันหลังแก้ว่าสำเร็จ (201) พร้อมยืนยันว่า duplicate จริงยังโดนบล็อกเหมือนเดิม (409)

**พบเพิ่มระหว่างสำรวจ (ยังไม่แก้ นอกขอบเขตรอบนี้)**: pattern `isActive` + `@@unique` แบบเดียวกันเป๊ะๆ มีอยู่ใน 9 model อื่นด้วย — `Faculty.code`, `Department`, `Program`, `Curriculum`, `CourseCategory`, `Course`, `Plo`, `Clo`, `Semester` — ทุกตัวมีบั๊กแบบเดียวกันในทางทฤษฎี (soft-delete แล้ว re-create ด้วยค่าเดิมจะชน 409) แต่เป็น org-structure ADMIN-only CRUD ที่ soft-delete+re-create ซ้ำชื่อเดิมเป็น edge case ที่เกิดน้อยกว่ามาก ไม่มีใคร flag ไว้มาก่อน ถ้าจะแก้ต้องเป็นงานแยกทีละ scope

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

**เช็คจริง (2026-08-08)**: coverage ของหมวด Gen Ed/เลือกเสรีใน ICT 2564 อยู่ที่ ~5.6% (2/36 หน่วยกิต), ICT 2569 ~6.7% (2/30 หน่วยกิต) — และมีแค่ 2 จาก 16 หลักสูตรทั้งระบบ (ICT 2 เวอร์ชัน) ที่มี `Course`/`CourseCategory` อยู่เลยแม้แต่แถวเดียว หลักสูตรอื่นทั้งหมดยังไม่ได้ import วิชาเลย ถือเป็น gap ใหญ่ ไม่ใช่จุดเล็กที่แก้ทันได้

**Frontend — แก้แล้ว (2026-08-26)**: หน้า `/learning-path` สร้างเสร็จไปแล้วก่อนหน้านี้ (`ElectiveCategoryList`) เดิม empty-state copy ตอนไม่มี catalog เลยเขียนว่า "ยังไม่มีข้อมูลวิชาแนะนำในหมวดนี้" เฉยๆ ดูเหมือนบั๊ก/ข้อมูลขาด — ปรับเป็นข้อความอธิบายเหตุผล+ทางออกชัดเจน: "หมวดนี้ยังขาดอีก X หน่วยกิต — เลือกได้จากทุกคณะทั่วมหาวิทยาลัย ระบบยังไม่มีรายชื่อวิชาให้แนะนำในหมวดนี้ ติดต่อฝ่ายทะเบียนหรือเลือกจากรายวิชาเปิดสอนในระบบทะเบียนกลาง" พร้อม icon แยกจาก state อื่น (`src/components/learning-path/elective-category-list.tsx`) กรณี "มี catalog แต่ไม่มีวิชาลงได้ตอนนี้" (`hasCatalog` true) ข้อความเดิมยังคงอยู่ ไม่เปลี่ยน

## ~~CourseInstructor — Grade Distribution + per-course student list~~ — resolved

รอบนี้ (CourseInstructor mapping + INSTRUCTOR scope) ทำเฉพาะ permission-wiring: เปิด `GET /clo-achievement/course/:id`, `GET /plo-achievement/course/:id`, และ `GET /courses/my-courses` ให้ INSTRUCTOR ที่ได้รับมอบหมายจริงเท่านั้น (`InstructorGuard`) — ยืนยันแล้วว่าเป็นการตัดสินใจที่ตั้งใจ ไม่ใช่ scope ที่ลืม: §9/§30 ยังต้องการ "Grade Distribution" (A/B/C/D/F breakdown เต็ม) และ "Student ที่เกี่ยวข้อง" (raw student list ต่อ course — `StudentCourseRecordService.findAll` ไม่มี course filter หรือ INSTRUCTOR branch เลย) ทั้งสองเป็น business logic ใหม่ทั้งหมด ไม่ใช่แค่เปิด permission จึงเก็บไว้เป็นรอบถัดไป — ยืนยันอีกครั้งใน Module 10 (Dashboard Endpoints): `GET /dashboard/instructor` เว้น Grade Distribution ไว้ด้วยเหตุผลเดียวกันนี้ (เลือก "เก็บไว้ก่อน" ไม่ bundle เข้ารอบนั้นตาม AskUserQuestion)

**Grade Distribution ปิดแล้ว**: `InstructorCourseSummary.gradeDistribution` (`GET /dashboard/instructor`) เพิ่ม full tally ทั้ง 12 ค่าของ `Grade` enum (A/B_PLUS/B/C_PLUS/C/D_PLUS/D/F/W/I/S/U) ผ่าน `StudentCourseRecordService.tallyGradeDistribution` ใหม่ (pure helper ทำงานบน `getLatestAttemptsPerStudent(courseId)` ที่มีอยู่แล้ว) — `achievementPercent` ข้างๆ กันเป็น "% B ขึ้นไป" อยู่แล้วตั้งแต่ Phase 8 (pass-through ของ `CloAchievementService`) ไม่ต้องแก้เพิ่ม

**"Student ที่เกี่ยวข้อง" ปิดแล้ว**: `GET /courses/:courseId/students` (endpoint ใหม่ — คนละ path จาก `StudentCourseRecordService.findAll`, ไม่ได้แก้ endpoint เดิม) คืน roster ขั้นต่ำ (`studentProfileId`/`studentCode`/`fullName`/`grade` ล่าสุด — ไม่มี email/ข้อมูลติดต่ออื่น) ผ่าน `StudentCourseRecordService.getStudentRosterForCourse` ใหม่ ซึ่ง reuse `getLatestAttemptsPerStudent(courseId)` เดิม (ตัวเดียวกับ Grade Distribution) — permission ใช้ `InstructorOrScopeGuard` (`SUPER_ADMIN`/`ADMIN`-with-scope/`INSTRUCTOR`-assigned) อยู่ในไฟล์ใหม่ `course-students.controller.ts` ที่ลงทะเบียนใน `StudentCourseRecordModule` (ไม่ใช่ `CourseModule`/`CourseController` — เพื่อเลี่ยง circular import เพราะ `StudentCourseRecordModule` import `CourseModule` อยู่แล้ว)

## Auth gaps closure — forgot-password email เป็น mock log เหมือน OTP/invitation

`PasswordResetService.create` ไม่ได้ส่งอีเมลจริง — log ผ่าน `console.warn('[PASSWORD RESET MOCK] ...')` เท่านั้น เป็น pattern เดียวกับ OTP/invitation ที่บันทึกไว้แล้ว ไม่ใช่ gap ใหม่ — ทั้งสามจุด (OTP, invitation, password reset) ต้องรอ real email service ตัวเดียวกันก่อน deploy จริง

## Module 12 — User Management: `POST /users` เปลี่ยนจาก invitation-token เป็น temp password ตรงๆ แล้ว

`UserManagementService.createStaffOrAdmin` **ไม่เรียก `PendingInvitationService.create` อีกต่อไป** (2026-08-08) — เปลี่ยนเป็น generate temp password แบบสุ่ม (`generateTempPassword()`, `apps/backend/src/common/util/password.util.ts`) hash แล้วตั้งให้ user ทันทีในทรานแซกชันเดียวกับที่สร้าง `User`+`UserRole`+`UserScope` คืนค่า `tempPassword` ใน response ครั้งเดียวให้ ADMIN/SUPER_ADMIN คัดลอกไปแจ้งเจ้าของบัญชีนอกระบบเอง (ไม่ต้องพึ่ง email service ที่ยังเป็น mock อยู่)

**`PendingInvitationService`/`POST /auth/accept-invitation`/`POST /users/:id/resend-invitation` ยังอยู่ครบ ไม่ได้ลบ** — แค่ไม่มีจุดเรียกใช้จาก `createStaffOrAdmin` แล้ว เพราะฉะนั้น `resend-invitation` จะ 404 ("no pending invitation") เสมอสำหรับ user ที่สร้างหลังการเปลี่ยนนี้ ซึ่งถูกต้องตามพฤติกรรมใหม่ ไม่ใช่ bug — เก็บโค้ดไว้เผื่อกลับมาใช้ invitation-based flow อีกครั้งถ้ามี email service จริงในอนาคต

`PasswordResetService`/`OtpService`'s mock-email gap (OTP, forgot-password) ยังคงเปิดอยู่เหมือนเดิม ไม่เกี่ยวกับการเปลี่ยนแปลงนี้

## ~~ไม่มี `mustChangePassword` flag บังคับเปลี่ยนรหัสผ่านครั้งแรก~~ — แก้แล้ว (2026-08-25)

**แก้แล้ว**: `User.mustChangePassword Boolean @default(false)` เพิ่มแล้ว (migration `20260825152549_add_must_change_password`) — set เป็น `true` ตอน `POST /users` สร้างบัญชีด้วย temp password, clear เป็น `false` ใน `PATCH /auth/change-password`

**Enforcement เป็น backend จริง ไม่ใช่แค่ frontend hint** — `JwtAuthGuard` (ทุก route ที่ protected ผ่านตัวนี้อยู่แล้ว) override `handleRequest()` เช็ค flag แล้ว throw 403 ถ้ายังไม่เปลี่ยน ยกเว้น route ที่ติด `@SkipPasswordChangeCheck()` (`GET /auth/me`, `PATCH /auth/change-password`, `POST /auth/logout`) อ่านค่าสดจาก DB ทุก request ผ่าน `JwtStrategy.validate()` เดียวกับที่เช็ค `isActive` อยู่แล้ว (ไม่ได้ฝังใน JWT payload เพื่อกัน staleness)

**Frontend**: `ProtectedRoute` เป็น choke point เดียว render ฟอร์มเปลี่ยนรหัสผ่านแทน children เมื่อ `user.mustChangePassword` — ไม่มี route/redirect แยก ครอบทุกหน้ารวม deep-link/reload อัตโนมัติ ฟอร์มเดียวกัน (`ChangePasswordForm`) ถูกเอาไปใช้ใน `/profile` เป็นปุ่มเปลี่ยนรหัสผ่านแบบสมัครใจด้วย (ก่อนหน้านี้ frontend ไม่มี UI เปลี่ยนรหัสผ่านเลย) — `/profile` เปิดให้ทุก role เข้าได้แล้ว (เดิม STUDENT-only)

ทดสอบ end-to-end ผ่านทั้ง curl (backend enforcement) และเบราว์เซอร์จริงแล้ว ดู `apps/frontend/FRONTEND_STATUS.md`

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

## Module 12 — UserScope self-modification guard เพิ่มแล้ว (2026-08-26)

พบระหว่างวางแผน ADMIN role UI ว่า `POST /users/:userId/scopes` (`grantScope`) และ `DELETE /users/:userId/scopes/:scopeId` (`revoke`) มีอยู่แล้วจริง (`UserScopeController`/`UserScopeService`, `apps/backend/src/modules/users/user-scope/`) — ไม่ใช่ gap ที่ต้องสร้าง endpoint ใหม่ตามที่เข้าใจผิดไปตอนแรก แต่ทั้งสอง method ไม่กัน ADMIN แก้/ลบ scope **ของตัวเอง** เลย (self-scope-elevation risk)

**แก้แล้ว**: เพิ่ม self-target check ใน `grantScope`/`revoke` (ซ้อนอยู่ใน `if (!requester.roles.includes('SUPER_ADMIN'))` เดิม — SUPER_ADMIN ยกเว้นเพราะ access ของตัวเองไม่ได้ผูกกับ scope) throw `ForbiddenException('Cannot modify your own scope')` ทดสอบยืนยันแล้วผ่าน curl จริง: self-grant/self-revoke โดน 403, grant/revoke user อื่นในสโคปยังทำงานปกติ (regression-safe)

**ยังไม่มี** (นอกขอบเขตรอบนี้): frontend UI สำหรับ Module 12 ทั้งหมด (สร้าง user, list, active-status, assign/revoke role, manage scope) — ต้องสร้างใหม่ทั้งหมด ไม่มี `lib/api/*` wrapper หรือ shared-types ใดๆ อยู่เลย
