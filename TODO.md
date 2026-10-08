# TODO

## Observations & Data Issues

### ✓ H9-H11 Testing (2026-09-29) — CLOSED
Orphaned STAFF account (`patcharadnaimingchua+eduanalyze-test@gmail.com`) deleted; see commit `chore: remove orphaned test STAFF account with no scope/dependencies`.

### ✓ Instructor redesign รอบ 1–2 — COMPLETE (pushed 2026-10-06)
- **รอบ 1:** `/instructor/dashboard`, `/instructor/students`, `/instructor/year-levels`, `/instructor/my-courses` — ข้อความสรุป rule-based (pure function + test), นับรายคน, การ์ดรายคนบนมือถือ, ตัวกรองเก็บใน URL
- **รอบ 2:** `/instructor/courses/[courseId]` — แท็บเหลือ 4 (ภาพรวม / นักศึกษา / กรอกคะแนน / CLO), โหมดแก้เกรดแยก, กรอกคะแนนเป็นขั้นตอน 1-2-3, ตัวสลับวิชาเป็นเมนูบนมือถือ, เตือนก่อนทิ้งคะแนนที่ยังไม่บันทึก; payload ของส่วนเขียนเทียบ f6c7526 ต่าง 0 (ทดสอบด้วย API interception)
- ไม่แก้ backend ทั้งสองรอบ

**สิ่งที่ยังค้าง/ควรรู้**
- skeleton ของหน้ารายวิชาขยับเล็กน้อยเมื่ออาจารย์มีวิชาเดียว (ตัวสลับวิชาถูกวาดใน skeleton แต่ไม่แสดงเมื่อมีวิชาเดียว)
- ปุ่ม "บันทึกคะแนนทั้งหมด" ยังกดได้แม้ไม่มีการแก้ไข และจะยิง `PUT /student-assessment-scores/bulk` ที่ `entries: []` (พฤติกรรมเดิม ไม่ได้แก้)
- ปุ่ม Back/Forward ของเบราว์เซอร์ดักเตือนค่าที่ยังไม่บันทึกไม่ได้ (ข้อจำกัดของเบราว์เซอร์)
- ลิงก์จากหน้าอื่นยังใช้ `?tab=gradebook` ผ่าน alias (ใช้ได้ ไม่เร่งแก้)

**ถัดไป:** Staff redesign

### Instructor รอบ 3 — แนว Academic Overview (เสร็จ, **ยังไม่ push** รอคำสั่ง)
Commit (7): `551c4eb` คำ+นับคน · `65ae3cb` helper · `e9a6ec5` GPA รวมเป็น null เมื่อไม่รู้หน่วยกิต · `559ccb5` Dashboard · `476d399` หน้ารายวิชา แท็บภาพรวม · `d96201b` ตารางวิชา × ชั้นปี · `6ddf018` กรอกคะแนนด้วยคำธรรมดา
ตัดสินใจแล้ว: GPA ถ่วงหน่วยกิตตามสูตร backend เดิม · % ได้ B ขึ้นไปถ่วงที่นั่ง · ภาคเรียนเป็นป้ายข้อความ · สถานะ 4 แบบเฉพาะ Instructor (ไม่แตะ `achievementStatus()` ที่ใช้ร่วม) · ตัวอย่างน้อย <10 คน
**ที่ยังค้าง / ควรทำต่อ**
- (ก) ตัวกรองภาคเรียนจริง (เกรดเฉลี่ย / F / W / ชั้นปีรายเทอม) ต้องแก้ backend: เพิ่ม `semesterId` ให้ `GET /dashboard/instructor` ตอนนี้ทำได้แค่ % B ขึ้นไปรายเทอมจาก `semesterTrend`
- (ข) % ผ่านเป้าแยกรายข้อของเป้าการเรียนรู้ ต้องแก้ backend (ตอนนี้คิดค่าเดียวต่อวิชา)
- (ค) เพิ่ม `credits` ใน `GET /dashboard/instructor` (หรือเปิด endpoint วิชาของอาจารย์) เพื่อเลิกดึง `GET /courses` ทั้งแคตตาล็อก (ตอนนี้ดึง ~100 วิชา เก็บเฉพาะ 3 วิชาของอาจารย์ แต่ยังโอนข้อมูลมาที่เบราว์เซอร์)
- (ง) คอมโพเนนต์ที่ไม่มีหน้าไหนใช้แล้วหลัง Dashboard ใหม่ (ยังไม่ลบ): `at-risk-students-card`, `clo-attention-card`, `course-insight-card`, `plo-coverage-card`, `course-comparison-chart`, `instructor-course-grid`, `course-overview-tab`, `course-overview-list`, `dashboard-kpis`, `goals-card` (ฝั่ง instructor) ลบเมื่อยืนยันว่าไม่ย้อนกลับไปแนวเก่า
- (จ) คำที่อยู่ในไฟล์ใช้ร่วมกับ Staff/Student ยังเป็นคำเดิม รอตัดสินใจ: เร่งด่วน/เฝ้าระวัง (`lib/risk-level.ts`), Sign Out / Academic Insights (`dashboard-shell`), "ตามหลังแผน" (Staff ชั้นปี + Student แดชบอร์ด), ตัวเลข PLO แบบ 0–5 (`PloRadarChart`, `PloProgressTable`)
- (ฉ) ปุ่ม Back/Forward ของเบราว์เซอร์ดักเตือนค่าที่ยังไม่บันทึกไม่ได้ (ข้อจำกัดเบราว์เซอร์)
- (ช) งานเก่าของแนวการ์ดงานอยู่ใน `git stash` "wip-commit2-task-style-2026-10-06" (ห้าม drop จนกว่าจะตัดสินใจ)
- (ซ) assessment "Exam (Quiz, เต็ม 100)" วิชา 02739111 สร้างเมื่อ 2026-10-06 15:33 (เวลาไทย) ไม่ใช่จากสคริปต์ทดสอบ (ทุกคำขอเขียนถูกดัก) น่าจะมาจากการลองหน้าเว็บเอง ยังอยู่ในฐานข้อมูล ไม่ได้ลบ
- (ญ) จำนวนผู้ลงทะเบียนจริง: ทุก endpoint ของ Instructor สร้างจากระเบียนเกรด (`StudentCourseRecord.grade` ไม่ว่าง และไม่มีตารางลงทะเบียน) จึงบอกไม่ได้ว่ามีกี่คนที่ยังไม่มีเกรด หน้า Course Overview จึงตัดสินความน่าเชื่อถือจากจำนวนคนที่มีเกรด (<5 ข้อมูลยังน้อย / 5–9 ตัวอย่างน้อย / ≥10 ปกติ) ถ้าจะวัดความครบข้อมูลจริงต้องมีแหล่งข้อมูลใหม่ (ตารางลงทะเบียน) เป็นงาน backend ในอนาคต
- (ฎ) การ์ดรายภาคของแนวโน้มยังไม่มีเกรดเฉลี่ยรายภาค เพราะ `semesterTrend` ไม่มี GPA ต้องแก้ backend (รวมกับข้อ (ก))

### Instructor — เลิกใช้เป้า 70% คงที่ในการตัดสิน (ตัดสินใจ 2026-10-07, **ยังไม่ push**)
เหตุผล: เป้า 70% ไม่ใช่เกณฑ์บังคับ และความยากของแต่ละวิชาไม่เท่ากัน การตัดสิน ผ่าน/ใกล้/ต่ำกว่าเป้า จึงทำให้วิชาที่ยากดูแย่โดยไม่ได้แปลว่าสอนไม่ดี
สิ่งที่ใช้แทน: ค่ากลางของเกรดจริง (เกรดที่พบมากที่สุด · เกรดกลาง · GPA วิชา · ≈ เกรดที่ใกล้ที่สุด · สูงสุด/ต่ำสุดที่พบ · ส่วนเบี่ยงเบนมาตรฐาน) คำนวณใน `lib/grade-center.ts` จาก `gradeDistribution` เท่านั้น นับเฉพาะ A–F (W/I/S/U ไม่นับ) กติกาจำนวนคน: <5 คน แสดงเฉพาะจำนวนต่อเกรด / 5–9 คน ป้าย "ตัวอย่างน้อย" / ≥10 ปกติ
**ผลที่ตามมา**
- หน้ารายวิชา (ภาพรวม), ตารางชั้นปี, ตารางวิชา × ชั้นปี และบรรทัดสรุปใต้ชื่อวิชาไม่มีป้ายผ่านเป้า/ใกล้เป้า/ต่ำกว่าเป้า ไม่มีขีด/แถบเป้า 70% และไม่ใช้สีแดง/เขียวตัดสิน วงแหวน "B ขึ้นไป" เหลือเป็นสัดส่วนล้วน
- ตารางวิชา × ชั้นปีเรียงตามรหัสวิชา (เดิมเรียง "ห่างเป้ามากสุดก่อน") จึงไม่มีลำดับที่ชี้ว่าวิชาไหนควรดูก่อน ถ้าต้องการลำดับใหม่ต้องตัดสินใจว่าจะเรียงด้วยอะไร (เช่น GPA วิชาต่ำสุดก่อน)
- บรรทัดสรุปใต้ชื่อวิชาตัดส่วน "เป้าการเรียนรู้ผ่าน/ยังไม่ผ่าน" และลูกศรเทอมล่าสุดออก (ส่วน "ต้องติดตาม N คน" ยังอยู่) การเทียบกับภาคก่อนย้ายไปอยู่ที่การ์ดรายภาค ("% B ขึ้นไป เทียบภาคก่อน +4 จุด") เฉพาะเมื่อทั้งสองภาคมีคนที่ได้เกรด ≥5 คน
- `achievementStatus()` และ field ใน API (`achievementThreshold`, `isAchieved`, `threshold`) ไม่ถูกแตะ แค่เลิกใช้ในหน้า Instructor ส่วนใหญ่
**ระดับ CLO (ตัดสินใจแล้ว 2026-10-07):** API ไม่มี % รายข้อ (ค่าเดียวต่อวิชา) จึงตัดคำตัดสินออก ไม่แสดง % ราย CLO การ์ด "เป้าการเรียนรู้" และแท็บ CLO แสดงรหัส (เรียงตามรหัส) คำอธิบาย และจำนวนคนที่มีคะแนนที่กรอก ตัดป้ายผ่าน/ไม่ผ่าน เกณฑ์ราย CLO และปุ่มดูรายชื่อที่ผูกกับสถานะ (ข้อมูลน้อย: <5 คน "ข้อมูลยังน้อย" ไม่แสดง % / 5–9 คน "ตัวอย่างน้อย") ฟีเจอร์ "ต่ำสุดในวิชานี้" และ "เทียบภาคก่อนราย CLO" ยังทำไม่ได้จนกว่า backend จะส่ง % ราย CLO และราย CLO ต่อภาค (ข้อ (ข) ด้านบน)
**รอการล้าง (ไม่ได้ลบ):** คอมโพเนนต์ที่ไม่มีหน้าไหนใช้และยังอ้างเป้า: `dashboard-kpis`, `course-overview-tab`, `course-overview-list`, `instructor-course-card`, `course-comparison-chart`, `clo-attention-card`, `plo-coverage-card`, `goals-card`, `course-insight-card` กับ `buildInstructorSummary`, `interpret-instructor-courses`, `STATUS_META`/`statusOf`/`sortByGap` ใน `lib/instructor-overview.ts` และ `StatusBadge`/`GoalBar` ใน `overview-parts.tsx` คำว่าผ่านเป้า/ใกล้เป้า/ต่ำกว่าเป้า/ยังไม่ถึงเป้าเหลือเฉพาะในไฟล์เหล่านี้ ไม่แสดงในหน้า Instructor ใด ลบพร้อมข้อ (ง) ข้างบน

### Staff redesign (รอทำ)
- ตรวจความหมายของ "จาก N รายการ" ในคอมโพเนนต์ `Pagination` ที่ใช้ร่วมกัน: หน้า Instructor นับเป็น "คน" แต่ Staff อาจนับเป็น "คน × วิชา" (ยังไม่แก้ เพราะ Staff ใช้ร่วม) — ตรวจแล้วตาราง Staff นับเป็นแถวของตารางนั้น (นักศึกษา / วิชา / ผลการเรียน) ไม่ใช่ "คน × วิชา" ที่ยังค้างคือคำว่า "รายการ" ในคอมโพเนนต์กลาง (หน้า Staff แก้ด้วยการเลี่ยงคำว่า "แสดง ... จาก" ที่หน้าทำเนียบแล้ว)
- (1) คนที่ไม่มีเกรดเลยต้องมีสถานะ "ยังไม่มีข้อมูล" ที่ backend: ตอนนี้ backend ตอบ `riskLevel: NORMAL` + `gpa: null` ฝั่งหน้าเว็บแยกให้ที่ชั้นแสดงผล (`components/staff/student-reading.ts`) จากเงื่อนไข NORMAL + ไม่มี GPA + ไม่มีวิชาเสี่ยง นักศึกษาที่มีแต่เกรด S ก็จะถูกอ่านเป็น "ยังไม่มีข้อมูล" ด้วย ต้องแก้ที่ backend ถึงจะแยกได้ถูกต้อง และ `GET /dashboard/staff` ยังไม่ส่งจำนวนคนที่มีเกรดต่อหลักสูตร หน้าเว็บนับเองจากรายชื่อ
- (2) รายชื่ออาจารย์ทั้งระบบเป็นปัญหาขอบเขต: `GET /users/instructors` ไม่กรองตามขอบเขตของผู้ขอ (`listInstructors()` ไม่รับ user) ทั้งที่คำอธิบาย API ว่า "within the requester scope" Staff จึงมอบหมายอาจารย์ข้ามคณะได้
- (3) หลักสูตรนอกขอบเขตรู้ตอนบันทึกถึงได้ 403: endpoint อ่านของ course-categories / courses / prerequisites / course-instructors ไม่กรองตามขอบเขต หน้าเว็บมีคำเตือนแค่กรณีเปิดผ่านลิงก์ (`outOfScope` ใน `curriculum-picker`)
- (4) Staff แก้/ลบเกรดได้กว้างกว่า Instructor: `@Roles` ของ `student-course-record` เปิดให้ STAFF เพิ่ม/แก้/ลบเกรดของนักศึกษาทุกวิชาในสาขา รอการตัดสินใจเชิงนโยบายว่าควรให้ Staff แก้ได้หรืออ่านอย่างเดียว
- (5) ปุ่ม 44px ทั้งระบบ: `ui/button` default 40px, `sm` 36px, ปุ่มแบ่งหน้า 32px, ตัวกรอง `h-9` แก้ที่ component กลางจะกระทบทุก role
- (6) ข้อความแบ่งหน้าที่ component กลาง: "แสดง a–b จาก N รายการ" ใน `ui/pagination` ใช้ร่วมกับ Instructor และ Admin ยังไม่ได้แก้
- (7) ซ่อน/ปิดอาจารย์และหลักสูตรนอกขอบเขตฝั่งหน้าเว็บ: ระหว่างรอ (2) และ (3) ที่ backend หน้าเว็บควรกรองรายชื่ออาจารย์และปิดปุ่มเขียนเมื่อหลักสูตรอยู่นอกขอบเขต
- (8) `DELETE /courses/:id` เป็นการปิดใช้งาน ไม่ได้ลบจริง และไม่ถูกปฏิเสธแม้มีเกรดหรือการมอบหมายอาจารย์ผูกอยู่: `course.service.ts:92-118` ตั้ง `isActive=false` เท่านั้น ปฏิเสธ (409) เฉพาะเมื่อมีวิชาอื่นใช้วิชานี้เป็นวิชาบังคับก่อน และลบแถววิชาบังคับก่อนของวิชานี้เองในธุรกรรมเดียวกัน ไม่ตรวจ `StudentCourseRecord` หรือ `CourseInstructor` (FK `onDelete: Restrict` ไม่ถูกแตะเพราะไม่มีการลบแถวจริง) เกรดและการมอบหมายจึงค้างอยู่กับวิชาที่ปิดแล้ว และอาจารย์จะไม่เห็นวิชานั้นอีกเพราะ `findMyCourses` กรอง `isActive` หน้า Staff ยังไม่มีปุ่มปิดหรือลบวิชา (ตั้งใจ) ต้องตัดสินนโยบายก่อนว่าจะปิดวิชาที่มีเกรดได้หรือไม่
- (9) `PATCH /courses/:id` ตั้ง `isActive` ไม่ได้: `UpdateCourseDto` คือ `CreateCourseDto` ลบ `curriculumId` (`dto/update-course.dto.ts:6-8`) และ `CreateCourseDto` ไม่มี `isActive` ส่วน `ValidationPipe` เปิด `whitelist` และ `forbidNonWhitelisted` (`main.ts:20-24`) การส่ง `isActive` จึงได้ 400 ผลคือวิชาที่ปิดไปแล้วเปิดกลับทาง API ไม่ได้ แก้ได้เฉพาะ code, name, nameEn, credits, description, isRequired, categoryId (รหัสวิชาซ้ำในหลักสูตร 409 และหมวดต้องอยู่ในหลักสูตรเดียวกัน)
- (10) `GET /courses` ส่ง `description` จริง (`course.service.ts` `findAll()` คืนทั้งแถวจาก Prisma) แต่ชนิด `CourseListItem` ใน `packages/shared-types` ไม่มีฟิลด์นี้ หน้าแก้วิชาจึงยังแสดงช่องคำอธิบายว่างและส่ง `description` ก็ต่อเมื่อพิมพ์ใหม่ ส่วน `nameEn` ที่ล้างจะส่ง `''` ทางแก้คือเพิ่ม `description` ในชนิดนั้นแล้วให้ `courseToFormValues` ใช้ค่าจริง (ฝั่งหน้าเว็บอย่างเดียว ไม่ต้องแก้ backend)
- (11) ตัวเลข "วิชาที่ยังไม่มีอาจารย์" และจำนวนอาจารย์นับฝั่งหน้าเว็บจาก `GET /courses` กับ `GET /course-instructors` อย่างละหนึ่งคำขอต่อหน้า (ไม่กรองตามขอบเขต กรองตามหลักสูตรฝั่ง client) การมอบหมายอาจารย์ไม่ผูกกับภาคเรียน ไม่มีตารางเปิดสอนต่อภาค
- (12) สำเนาใน `components/staff` ที่อาจห่างจากต้นฉบับ: `staff-add-record-form` (จาก `add-record-form`), `staff-grade-select` (จาก `grade-select-confirm`), `staff-combobox` (จาก `ui/combobox`), `staff-pagination` (จาก `ui/pagination`) ถ้าแก้ที่ต้นฉบับ (ข้อ 5 และ 6) ควรยุบสำเนากลับ
- (13) เมนูทุก role ย้ายไป `components/dashboard/nav-config.ts` โดยไม่เปลี่ยนรายการของ role อื่น (มีเทสต์ล็อกไว้) เฉพาะเมนู Staff ใช้ `matchPrefixes`
- (14) หลักสูตรนอกขอบเขต (เปิดผ่านลิงก์) หน้าหลักสูตรซ่อนข้อมูลและแสดงคำเตือน แต่รายชื่ออาจารย์ที่ให้เลือกยังเป็นของทั้งระบบ (ข้อ 2)

### pm25-pipeline (โปรเจกต์ของอีกวิชา)
หยุดอยู่ สาเหตุยังไม่ทราบ อาจชนพอร์ต 5433 ยังไม่ตรวจ (ห้ามสตาร์ท/หยุด/แตะ container หรือ volume ของมัน)

---

## Backend & Data Issues

### ✓ On-track by Year Level (M20) — COMPLETE
Three commits delivered (2026-09-30):
- **A:** Prisma migration adds `Curriculum.durationYears` (default 4, 1-8 range), `CreateCurriculumDto` field, year-level helper in `apps/backend/src/common/academic/year-level.ts` with formula `expected = min(total, ceil(total × max(0, currentYear − admissionYear) / durationYears))`, and dashboard fields `yearLevel`, `expectedCredits`, `onTrackStatus`.
- **B:** Student dashboard credits card shows amber "ตามหลังแผน" or emerald "ตามแผน" badge; admin curriculum form has `durationYears` field (default 4, validation 1-8).
- **C:** Year Level Overview (STAFF/INSTRUCTOR) shows "ตามหลังแผน N" badge on year cards and student rows, reusing the same pure helpers.

---

## Known Technical Debt

### Backend ESLint Config (pre-existing)
`apps/backend/` has no ESLint setup. Tests (Jest 96/96), TypeScript (`tsc`), and Prisma migrations are the current gates. This is a pre-existing issue outside the M20 scope but noted here for future build-quality work.


### Staff/Admin — สถานะนักศึกษาใช้ GPA สะสม (ตัดสินใจ 2026-10-08, **ยังไม่ push**)
เกณฑ์ (ค่าคงที่เดียว `GPA_CRITICAL_BELOW` / `GPA_WATCH_BELOW` ใน `grade-point.constant.ts`): GPA สะสมต่ำกว่า 1.50 = เร่งด่วน · 1.50–1.74 = เฝ้าระวัง · 1.75 ขึ้นไป = ปกติ · ไม่มี GPA (ไม่นับ W/I/S/U) = ยังไม่มีข้อมูล เดิมใช้เกรดที่แย่ที่สุดรายวิชา
- Admin "เสี่ยง" (จำนวนนักศึกษาในหลักสูตร) ใช้เกณฑ์เดียวกัน เลิก GPA < 2.0
- Instructor ไม่ใช้ GPA และไม่ใช้ป้าย "เร่งด่วน/เฝ้าระวัง" แล้ว (ตัดสินใจ 2026-10-08) ใช้ข้อเท็จจริงรายวิชาแทน: "มีเกรด D+ ลงไป" = ผลล่าสุดของวิชาหนึ่งในวิชาของอาจารย์เป็น D+/D/F/U (ไม่รวม C) ค่าคงที่ใน `lib/low-grade.ts` ฝั่ง frontend เท่านั้น backend ยังส่ง `riskLevel` รายวิชาเดิมแต่ UI Instructor ไม่ใช้
- หน้ารายละเอียดนักศึกษา (Staff) มีข้อความรอง "มีรายวิชา D+/D/F/U อยู่ X วิชา" ไม่ใช้ตัดสินสถานะ
- ผลต่อเดโม: นักศึกษาที่มีแต่เกรด U (ไม่มี GPA) เดิมเป็น "เร่งด่วน" ตอนนี้เป็น "ยังไม่มีข้อมูล"
**ที่ยังค้าง**
- **ยืนยันเกณฑ์ 1.50 / 1.75 กับกฎของมหาวิทยาลัย** (ตอนนี้เป็นค่าที่กำหนดเอง ยังไม่ได้อ้างอิงข้อบังคับ)
- **ต้องติดตามด้วย GPA สะสมสำหรับ Instructor** รอนโยบายความเป็นส่วนตัวจากมหาวิทยาลัย (ต้องเปิด `gpaRiskLevel` ใน 3 endpoint ถ้าอนุมัติ: `getInstructorDashboard`, `getInstructorStudents`, `getInstructorYearLevels`) ตอนนี้ API ฝั่ง Instructor ไม่ส่ง GPA
- `seed-demo.ts` เปลี่ยนจากดูวิชาของ demo-instructor เป็นระบุวิชาและหลักสูตรตรงๆ (`DEMO_COURSE_CODES`, `DEMO_CURRICULUM_ID`) เพราะ demo-instructor ถูกย้ายไปสอน 02739341 หลัง seed เดิมรัน; เพิ่มนักศึกษา GPA ต่ำ DEMO-GEN-0151..0182 (32 คน, 85 รายการ)

### จัดเลย์เอาต์ Staff / Instructor / Admin จากโค้ด (2026-10-08, **ยังไม่ push**) — ยังไม่เคยดูผลจริงบนหน้าจอ
ทำจากการอ่าน className อย่างเดียว (ไม่เปิดเบราว์เซอร์ ไม่ถ่ายภาพ) จึงยังไม่ได้ตรวจ dark mode และความกว้างจริงบนมือถือ/แท็บเล็ต ควรเปิดดูทุกหน้าหนึ่งรอบก่อน push
**ที่ปล่อยไว้ เพราะแก้โดยไม่เห็นภาพไม่ปลอดภัย (ต้องรู้ความกว้างจริง)**
- ฟอร์มเพิ่มรายวิชา (Staff) และฟอร์มผูก CLO (Instructor) ใช้ 1 คอลัมน์จนถึง `lg` แล้วเป็น 3 คอลัมน์ ไม่ทราบว่าแท็บเล็ตที่ความกว้างเท่าไรจึงพอสำหรับ 3 ช่อง ถ้ากว้างพอ อาจลดเป็น `md`
- ตัวเลือกหลักสูตรหัวหน้า Staff curriculum กว้างคงที่ `sm:w-96` ข้างปุ่ม "เพิ่มรายวิชาใหม่" ถ้าจอแคบแถวอาจแตก
- การ์ดแนวโน้มรายภาคของ Instructor (`sm:grid-cols-2 lg:grid-cols-3`) ถ้าจำนวนภาคหารสามไม่ลงตัวจะเหลือการ์ดเดียวในแถวสุดท้าย (ขึ้นกับจำนวนภาคจริง)
- ช่องกรอกคะแนนใน `student-score-entry-panel` ใช้ความกว้างคงที่ (`sm:w-80`, `5.25rem`) ยังไม่ได้ตรวจกับตัวเลขยาว
- ฟอร์มสร้างหลักสูตร Admin (`sm:grid-cols-3 lg:grid-cols-5`) ไม่ได้ตรวจว่าจำนวนช่องหารลงตัวกับ 3 และ 5
- ระยะห่างยังไม่เป็นสเกลเดียวทั้งระบบ (มี gap-2/3/4, px-4/5, py-3/3.5 ปนกัน) แก้โดยไม่เห็นภาพเสี่ยงทำหน้าที่ดีอยู่แล้วเพี้ยน
- คอมโพเนนต์ที่ไม่มีหน้าไหนใช้แล้ว (`instructor-course-card` มี `truncate`, `course-overview-list`, `course-overview-tab` มีตาราง) ไม่ได้แก้ รอลบพร้อมข้อ (ง)
**แก้แล้ว:** ตารางกว้างของ Staff 5 ตาราง + ตาราง Instructor 2 ตารางเลื่อนแนวนอนในกรอบแทนที่จะล้นหน้า · ตัวกรองหน้ารายชื่อนักศึกษา Staff, ตัวกรองวิชา Staff, ตัวกรองนักศึกษา Instructor เป็น grid ที่ช่องเท่ากัน (ไม่หล่นช่องเดียว) · คำนิยามสถานะ Staff เป็นรายการ ใช้ข้อความชุดเดียวกับหน้า Dashboard · ปุ่มในตารางลดความกว้าง สูงคงที่ 44px · เลิกตัดข้อความด้วย "…" ใน Admin 2 จุด

### ADMIN: งานค้างหลังอุดช่องโหว่สิทธิ์ (2026-10-08)
- **ลดสิทธิ์ ADMIN ต่อ API หลักสูตร/คำเชิญ (least privilege):** ตอนนี้ ADMIN เรียก CRUD/ลบ หลักสูตร สาขา ภาค รายวิชา PLO/CLO และคำเชิญนักศึกษาได้ ทั้งที่ไม่มี UI รองรับ ต้องตัดสินใจว่าจะตัดสิทธิ์หรือเปิดหน้าให้
- **audit log / lastLogin:** ยังไม่มีตารางบันทึกการกระทำหรือเวลาเข้าสู่ระบบล่าสุด ต้องแก้ schema (ตาราง User มีแค่ createdAt/updatedAt)
- **อาจารย์ที่ไม่มีขอบเขต:** ไม่ขึ้นใน `/admin/users` และ `userCounts.instructor` ของ `/dashboard/admin/scope-overview` ไม่นับ ส่วน `GET /users/instructors` คืนอาจารย์ทั้งระบบ (ตั้งใจ แก้แค่คำอธิบาย Swagger แล้ว)
- ADMIN เพิ่ม STAFF ให้บัญชีที่ยังไม่มีบทบาท STAFF (เช่น อาจารย์) ไม่ได้แล้ว เพราะ ADMIN จัดการได้เฉพาะบัญชี STAFF ต้องให้ SUPER_ADMIN เพิ่มให้
- หน้า `/admin/users/[id]` ยังไม่เคยดูผลจริงบนหน้าจอ (dialog ยืนยัน, ปุ่มสูง 44px, dark mode)

### ข้อความที่ยังถูกตัดด้วย "…" (ตรวจ 2026-10-08, ยังไม่แก้)
- `components/credit-checker/prerequisite-flow-node.tsx:45` — ชื่อรายวิชาในกราฟวิชาบังคับก่อนใช้ `truncate` (มี `title` แสดงเต็มเมื่อชี้เมาส์ แต่ไม่มีบนมือถือ)
- `components/instructor/instructor-course-card.tsx` — มี `truncate` แต่ไม่มีหน้าไหนใช้ (รอลบ)
- ไม่พบ `text-ellipsis` / `line-clamp` ที่อื่น (ที่มี `truncate` ใน Combobox/Select แก้แล้ว)

### SUPER_ADMIN: งานค้างหลังรอบความปลอดภัย (2026-10-08)
- **API เปิดใช้คืนรายการที่ปิดไปแล้ว:** คณะ ภาควิชา สาขา หลักสูตร ปีการศึกษา ภาคเรียน ปิดแล้ว (`isActive=false`) เปิดคืนจากหน้าจอหรือ API ไม่ได้ ต้องให้ผู้ดูแลฐานข้อมูลแก้ (dialog ยืนยันบอกผู้ใช้ไว้แล้ว) ต้องเพิ่ม endpoint + ปุ่ม + ตรวจรหัสซ้ำตอนเปิดคืน
- **JWT / บทบาท / ระงับบัญชีต้องมีผลทันที:** ระงับบัญชีมีผลทันทีแล้ว (`JwtStrategy.validate` ตรวจ `isActive` จาก DB ทุก request) แต่บทบาทอ่านจาก JWT (access 15 นาที, refresh 7 วัน) ถอดบทบาทแล้วยังใช้สิทธิ์เดิมได้สูงสุด 15 นาที และ refresh ออกโทเค็นใหม่จากบทบาทใน DB จึงมีผลเมื่อโทเค็นหมดอายุเท่านั้น ทางแก้ที่กระทบน้อยที่สุด: ให้ `JwtStrategy.validate` อ่านบทบาทจาก DB แทน `payload.roles` (แคชในหน่วยความจำสั้นๆ เช่น 5-10 วินาที และล้างแคชเมื่อมีการให้/ถอดบทบาท)
- **ลดสิทธิ์ SA/ADMIN ต่อ API แก้วิชา/CLO/PLO/mapping/คำเชิญ (least privilege) พร้อมกัน:** ตอนนี้ SA/ADMIN เรียก CRUD รายวิชา หมวดวิชา CLO PLO mapping assessment คำเชิญนักศึกษา และ PLO ระดับ cohort/หลักสูตรได้ ทั้งที่ไม่มี UI ต้องตัดสินใจรวมกันว่าจะตัดสิทธิ์หรือเปิดหน้าให้ แล้วแก้ `@Roles` ของ SA และ ADMIN ในรอบเดียว
- **SA ไม่เห็นคณะ/ภาควิชาของหลักสูตร** ในหน้าคุณภาพหลักสูตร เพราะ `/dashboard/curricula` ไม่ส่งชื่อคณะ/ภาควิชา (ถ้าต้องการ ให้เพิ่มฟิลด์ใน `SystemCurriculumEntry`)
- backend ยังไม่มีไฟล์ตั้งค่า ESLint (`npm run lint` ใช้ไม่ได้) ตรวจได้แค่ `tsc` และ jest
- ยังไม่เคยดูผลจริงบนหน้าจอ: dialog ปิดใช้งาน (องค์กร/ปีการศึกษา), ปุ่มสูง 44px ในสองหน้านั้น, หน้าคุณภาพหลักสูตรของ SA, dark mode ของ 3 ไฟล์ที่เพิ่ม `dark:`
