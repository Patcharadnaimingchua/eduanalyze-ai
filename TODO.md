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

### Instructor รอบ 3 — แนว Academic Overview (กำลังทำ, ยังไม่ push)
ตัดสินใจแล้ว: เกรดเฉลี่ยถ่วงหน่วยกิตตามสูตร backend เดิม · % ได้ B ขึ้นไปถ่วงที่นั่ง · ภาคเรียนเป็นป้ายข้อความ · สถานะ 4 แบบ (ผ่านเป้า / ใกล้เป้า ≤5 จุด / ยังไม่ถึงเป้า / ยังไม่มีเกรด) ใช้เฉพาะ Instructor ไม่แตะ `achievementStatus()` ที่ใช้ร่วม · ตัวอย่างน้อย <10 คน
- ✓ C1 ปรับคำ + นับคนไม่ซ้ำ (`551c4eb`), ✓ C2 helper `lib/instructor-overview.ts` + test
- **ที่ต้องแก้ backend แต่ยังไม่ทำ:** (1) ตัวกรองภาคเรียนจริง (เกรดเฉลี่ย / F / W / ชั้นปีรายเทอม) ต้องเพิ่ม `semesterId` ให้ `GET /dashboard/instructor` ตอนนี้ได้แค่ % B ขึ้นไปรายเทอมจาก `semesterTrend` (2) % ผ่านเป้าแยกรายข้อของเป้าการเรียนรู้ (backend คิดค่าเดียวต่อวิชา)
- งานเก่าของแนวการ์ดงานเก็บไว้ใน `git stash` ชื่อ "wip-commit2-task-style-2026-10-06" (ห้าม drop จนกว่าจะตัดสินใจ)

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

