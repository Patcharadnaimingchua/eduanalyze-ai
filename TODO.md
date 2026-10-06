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
- (ง) คอมโพเนนต์ที่ไม่มีหน้าไหนใช้แล้วหลัง Dashboard ใหม่ (ยังไม่ลบ): `at-risk-students-card`, `clo-attention-card`, `course-insight-card`, `plo-coverage-card`, `course-comparison-chart`, `instructor-course-grid` (ฝั่ง instructor) ลบเมื่อยืนยันว่าไม่ย้อนกลับไปแนวเก่า
- (จ) คำที่อยู่ในไฟล์ใช้ร่วมกับ Staff/Student ยังเป็นคำเดิม รอตัดสินใจ: เร่งด่วน/เฝ้าระวัง (`lib/risk-level.ts`), Sign Out / Academic Insights (`dashboard-shell`), "ตามหลังแผน" (Staff ชั้นปี + Student แดชบอร์ด), ตัวเลข PLO แบบ 0–5 (`PloRadarChart`, `PloProgressTable`)
- (ฉ) ปุ่ม Back/Forward ของเบราว์เซอร์ดักเตือนค่าที่ยังไม่บันทึกไม่ได้ (ข้อจำกัดเบราว์เซอร์)
- (ช) งานเก่าของแนวการ์ดงานอยู่ใน `git stash` "wip-commit2-task-style-2026-10-06" (ห้าม drop จนกว่าจะตัดสินใจ)
- (ซ) assessment "Exam (Quiz, เต็ม 100)" วิชา 02739111 สร้างเมื่อ 2026-10-06 15:33 (เวลาไทย) ไม่ใช่จากสคริปต์ทดสอบ (ทุกคำขอเขียนถูกดัก) น่าจะมาจากการลองหน้าเว็บเอง ยังอยู่ในฐานข้อมูล ไม่ได้ลบ

### Staff redesign (รอทำ)
- ตรวจความหมายของ "จาก N รายการ" ในคอมโพเนนต์ `Pagination` ที่ใช้ร่วมกัน: หน้า Instructor นับเป็น "คน" แต่ Staff อาจนับเป็น "คน × วิชา" (ยังไม่แก้ เพราะ Staff ใช้ร่วม)

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

