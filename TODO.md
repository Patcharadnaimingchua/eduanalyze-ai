# TODO / Known Limitations

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
