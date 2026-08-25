# Frontend Status (สรุปสถานะ ณ 2026-08-25)

> อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง เพื่อไม่ต้อง re-explore โค้ด
> ดู backlog เต็มที่ root `TODO.md`

## 1. หน้าที่เสร็จแล้ว (ทุกหน้า functional, ต่อ API จริงผ่าน react-query)

### STUDENT

| Path | สรุป |
|---|---|
| `app/page.tsx` | Landing, auth-aware redirect |
| `app/login/page.tsx` | Login form (RHF+zod), รองรับ OTP-pending |
| `app/register/page.tsx` | Register form + org/curriculum select |
| `app/register/google/page.tsx` | Complete Google OAuth signup |
| `app/(auth)/forgot-password/page.tsx` | ขอ reset password (email เป็น mock) |
| `app/(auth)/reset-password/page.tsx` | Reset password ด้วย token |
| `app/(auth)/verify-otp/page.tsx` | OTP form (OTP ถูก disable ฝั่ง server อยู่) |
| `app/dashboard/page.tsx` | Dashboard: stat cards + entrance animation |
| `app/academic-record/page.tsx` | Transcript timeline, entrance + removal animation |
| `app/aptitude-analysis/page.tsx` | PLO radar chart + rule-based interpretation (ไม่ใช้ AI live) |
| `app/clo-plo-analysis/page.tsx` | CLO/PLO achievement cards |
| `app/course-assessment/[courseId]/page.tsx` | Self-assessment form ต่อ course |
| `app/credit-checker/page.tsx` | Credit check + prerequisite flow chart (hand-rolled) |
| `app/learning-path/page.tsx` | Drag-and-drop planner (client-only, ไม่มี persist) |
| `app/profile/page.tsx` | Profile/org info |

### INSTRUCTOR

| Path | สรุป |
|---|---|
| `app/instructor/dashboard/page.tsx` | Course card grid + detail panel (3 tab: Grade Distribution / CLO Achievement / Student Roster), state ขับเคลื่อนด้วย `?courseId=&tab=` query param ล้วนๆ (ไม่มี useState คู่ขนาน) |

ดึงข้อมูลจาก `GET /dashboard/instructor` เป็นหลัก (course grid + grade distribution + CLO/PLO list มาในก้อนเดียว) ส่วน `GET /clo-achievement/course/:id` และ `GET /courses/:id/students` ยิงแบบ lazy เฉพาะตอนเปิด tab นั้นจริง — ดู `src/components/instructor/instructor-detail-panel.tsx` สำหรับ query lifecycle ทั้งหมด (อยู่ที่ parent เดียว ลูกเป็น presentational ล้วน)

ทดสอบ end-to-end ผ่านเบราว์เซอร์จริงแล้ว (2026-08-25, Playwright) — ดูรายละเอียดการ setup test account ผ่าน flow จริง (POST /users, POST /course-instructors, POST /student-course-records) ใน conversation history หรือถามให้สรุปซ้ำได้

### ADMIN (SUPER_ADMIN only)

| Path | สรุป |
|---|---|
| `app/admin/academic-years/page.tsx` | CRUD ปีการศึกษา+ภาคเรียน (create/soft-delete ทั้งคู่, semester ผูกกับปีที่เลือก, ป้องกันเพิ่มภาคเรียนซ้ำ term เดิมในปีเดียวกันฝั่ง UI ด้วยการกรอง `availableTerms`) |

ไม่มี edit ปี/เทอมในตัว (แค่ create+delete) — backend มี PATCH ให้แล้วแต่ยังไม่ได้ทำ UI แก้ไข (เพิ่มทีหลังได้ถ้าจำเป็น) `RequireRole role="SUPER_ADMIN"` เท่านั้น (ตรงกับ backend guard ของ mutating endpoint — GET เปิดกว้างกว่านั้นแต่หน้านี้ทั้งหน้าเป็นหน้า manage จึงจำกัดทั้งหน้า) ทดสอบ end-to-end ผ่านเบราว์เซอร์จริงแล้ว (2026-08-25): create, duplicate-year 409, add/delete semester, delete year, role-block ครบ

ไม่มีหน้า stub — ทุกหน้าดึงข้อมูลจริงผ่าน `lib/api/*`.

## 2. Animation patterns

- **ห้ามใช้ framer-motion / recharts / react-flow** — เป็น convention ที่ตั้งใจ (มี comment อธิบายไว้หลายที่)
- **Count-up ตัวเลข**: hook `src/lib/use-count-up.ts` → `useCountUp(target, { duration, decimals, replayKey })` (hand-rolled rAF + ease-out-cubic)
- **Entrance/exit**: Tailwind plugin `tailwindcss-animate` (ใน `tailwind.config.ts`)
  - เข้า: `animate-in fade-in-0 slide-in-from-bottom-4 duration-500` (ใช้ใน dashboard, academic-record)
  - ออก: `animate-out fade-out-0 slide-out-to-top-4 duration-500` (ใช้ใน `record-timeline.tsx`)
  - Loading skeleton: `animate-pulse` (`dashboard-skeleton.tsx`)
- ไม่มี custom `@keyframes` ใน `globals.css` — ใช้แค่ tailwindcss-animate + useCountUp
- Chart/flow chart ใน credit-checker, radar ใน aptitude-analysis = SVG hand-rolled ทั้งหมด

## 3. Reusable UI components (`src/components/ui/`)

shadcn-style, hand-rolled (ไม่ใช้ Radix):
`alert.tsx`, `badge.tsx` (tone-based: green/amber/red/gray — เพิ่ม 2026-08-25 แทน `<span>+cn()` inline ที่เคยซ้ำอยู่หลายจุด), `button.tsx`, `card.tsx` (Card/CardHeader/CardContent/CardTitle), `combobox.tsx`, `form.tsx` (RHF wrapper), `input.tsx`, `label.tsx`, `progress.tsx`, `select.tsx`, `slider.tsx`, `textarea.tsx`

`DashboardShell` (`src/components/dashboard/dashboard-shell.tsx`) เป็น role-aware แล้ว (nav items ตาม `role` prop, default `'STUDENT'` — 9 หน้า STUDENT เดิมเรียกแบบไม่ใส่ `role` ได้เหมือนเดิม ไม่ต้องแก้) ส่วน role-gate ใช้ `src/components/auth/require-role.tsx` (`<RequireRole role="INSTRUCTOR">`) — หน้า STUDENT เดิมยังใช้ inline `isStudent` check เดิมอยู่ ยังไม่ได้ retro-fit ให้ใช้ `RequireRole` ร่วม

## 4. Convention ที่ตกลงกันไว้

- **ห้าม** framer-motion, recharts, react-flow/reactflow, dnd-library
- Animation ทั้งหมด hand-roll ก่อนเสมอ (Tailwind utilities + custom hook) — ใช้ library เฉพาะกรณีจำเป็นจริงมากๆ เท่านั้น (ปัจจุบันยังไม่มีข้อยกเว้น)
- Drag-and-drop ใช้ native HTML5 DnD + ปุ่ม move fallback สำหรับ touch device
- ตอบ user เป็นภาษาไทย (โค้ด/comment เป็นอังกฤษ) — ดู `apps/CLAUDE.md`
- อ่าน `PROJECT_CONTEXT.md` / `CONVENTIONS.md` ก่อนเริ่มงานเสมอ (ตาม `apps/CLAUDE.md`)

## 5. Backlog (เต็มดูที่ root `TODO.md`)

- OTP verification ถูก skip ทั้งระบบ (`SKIP_OTP_VERIFICATION = true`) — ต้อง revert ก่อนขึ้น production จริง (security risk)
- Learning Path ไม่มี backend persistence — state หายเมื่อ reload
- Email (forgot-password/OTP/invite) เป็น mock (console.warn เท่านั้น)
- PLO/CLO seed data ครอบคลุมแค่ 24/96 วิชา ที่เหลือเป็น demo data
- AI Skill Analysis ไม่มี caching/persistence, ต้องใช้ ANTHROPIC_API_KEY จริง
- ไม่มี admin UI สำหรับ AcademicYear/Semester CRUD
- ไม่มี enforcement ของ `mustChangePassword`

## 6. Dev environment gotcha (พบ 2026-08-25)

เคยมี backend process เก่าค้าง (รันมาจาก path `/Users/patcharadnai/Downloads/eduanalyze-ai/` ที่ไม่มี `Projects/` — น่าจะเป็นซากจากตอนย้ายโปรเจกต์) ครอง port 3001 อยู่นานหลายวัน ทำให้ backend ตัวจริงจาก `Projects/eduanalyze-ai` (ที่ `nest start --watch` เอง) bind port ไม่ได้เงียบๆ — API calls ทั้งหมดไปโดน process เก่าโดยไม่รู้ตัว ก่อนเริ่มงาน backend ครั้งต่อไป ควรเช็คว่า `lsof -iTCP:3001 -sTCP:LISTEN -P -n` คืน cwd ตรงกับ `Projects/eduanalyze-ai/apps/backend` จริง
