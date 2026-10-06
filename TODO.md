# TODO

## Observations & Data Issues

### ✓ H9-H11 Testing (2026-09-29) — CLOSED
Orphaned STAFF account (`patcharadnaimingchua+eduanalyze-test@gmail.com`) deleted; see commit `chore: remove orphaned test STAFF account with no scope/dependencies`.

### ✓ Instructor redesign รอบ 1 — COMPLETE (pushed 2026-10-06, origin/main = f6c7526)
`/instructor/dashboard`, `/instructor/students`, `/instructor/year-levels`, `/instructor/my-courses`: ข้อความสรุป rule-based (pure function + test), นับรายคน, การ์ดรายคนบนมือถือ, ตัวกรองเก็บใน URL, ไม่แก้ backend
- **เหลือรอบ 2:** `/instructor/courses/[courseId]` (มีฟังก์ชันเขียนข้อมูล ต้องตรวจ POST/PATCH/DELETE ต่างหาก)

### Staff redesign (รอทำ)
- ตรวจความหมายของ "จาก N รายการ" ในคอมโพเนนต์ `Pagination` ที่ใช้ร่วมกัน: หน้า Instructor นับเป็น "คน" แต่ Staff อาจนับเป็น "คน × วิชา" (ยังไม่แก้ เพราะ Staff ใช้ร่วม)

### pm25-pipeline (โปรเจกต์ของอีกวิชา)
หยุดอยู่ สาเหตุยังไม่ทราบ อาจชนพอร์ต 5433 ตรวจทีหลัง (ห้ามสตาร์ท/หยุด/แตะ container หรือ volume ของมัน)

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

