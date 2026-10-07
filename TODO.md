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

### Staff redesign (รอทำ)
- ตรวจความหมายของ "จาก N รายการ" ในคอมโพเนนต์ `Pagination` ที่ใช้ร่วมกัน: หน้า Instructor นับเป็น "คน" แต่ Staff อาจนับเป็น "คน × วิชา" (ยังไม่แก้ เพราะ Staff ใช้ร่วม) — ตรวจแล้วตาราง Staff นับเป็นแถวของตารางนั้น (นักศึกษา / วิชา / ผลการเรียน) ไม่ใช่ "คน × วิชา" ที่ยังค้างคือคำว่า "รายการ" ในคอมโพเนนต์กลาง (หน้า Staff แก้ด้วยการเลี่ยงคำว่า "แสดง ... จาก" ที่หน้าทำเนียบแล้ว)
- (1) คนที่ไม่มีเกรดเลยต้องมีสถานะ "ยังไม่มีข้อมูล" ที่ backend: ตอนนี้ backend ตอบ `riskLevel: NORMAL` + `gpa: null` ฝั่งหน้าเว็บแยกให้ที่ชั้นแสดงผล (`components/staff/student-reading.ts`) จากเงื่อนไข NORMAL + ไม่มี GPA + ไม่มีวิชาเสี่ยง นักศึกษาที่มีแต่เกรด S ก็จะถูกอ่านเป็น "ยังไม่มีข้อมูล" ด้วย ต้องแก้ที่ backend ถึงจะแยกได้ถูกต้อง และ `GET /dashboard/staff` ยังไม่ส่งจำนวนคนที่มีเกรดต่อหลักสูตร หน้าเว็บนับเองจากรายชื่อ
- (2) รายชื่ออาจารย์ทั้งระบบเป็นปัญหาขอบเขต: `GET /users/instructors` ไม่กรองตามขอบเขตของผู้ขอ (`listInstructors()` ไม่รับ user) ทั้งที่คำอธิบาย API ว่า "within the requester scope" Staff จึงมอบหมายอาจารย์ข้ามคณะได้
- (3) หลักสูตรนอกขอบเขตรู้ตอนบันทึกถึงได้ 403: endpoint อ่านของ course-categories / courses / prerequisites / course-instructors ไม่กรองตามขอบเขต หน้าเว็บมีคำเตือนแค่กรณีเปิดผ่านลิงก์ (`outOfScope` ใน `curriculum-picker`)
- (4) Staff แก้/ลบเกรดได้กว้างกว่า Instructor: `@Roles` ของ `student-course-record` เปิดให้ STAFF เพิ่ม/แก้/ลบเกรดของนักศึกษาทุกวิชาในสาขา รอการตัดสินใจเชิงนโยบายว่าควรให้ Staff แก้ได้หรืออ่านอย่างเดียว
- (5) ปุ่ม 44px ทั้งระบบ: `ui/button` default 40px, `sm` 36px, ปุ่มแบ่งหน้า 32px, ตัวกรอง `h-9` แก้ที่ component กลางจะกระทบทุก role
- (6) ข้อความแบ่งหน้าที่ component กลาง: "แสดง a–b จาก N รายการ" ใน `ui/pagination` ใช้ร่วมกับ Instructor และ Admin ยังไม่ได้แก้
- (7) ซ่อน/ปิดอาจารย์และหลักสูตรนอกขอบเขตฝั่งหน้าเว็บ: ระหว่างรอ (2) และ (3) ที่ backend หน้าเว็บควรกรองรายชื่ออาจารย์และปิดปุ่มเขียนเมื่อหลักสูตรอยู่นอกขอบเขต

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

