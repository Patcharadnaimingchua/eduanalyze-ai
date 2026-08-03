อ่านไฟล์ PROJECT_CONTEXT.md ที่ root ของโปรเจกต์นี้ก่อน (ถ้ายังไม่มีไฟล์นี้ ให้บอกฉัน ฉันจะสร้างให้)
นี่คือ Master Requirement ของระบบ EduAnalyzeAI ให้ยึดเป็นหลักเหนือ code เดิมใดๆ

จากนั้นสำรวจโครงสร้างโปรเจกต์ทั้งหมดใน apps/backend และ apps/frontend ที่มีอยู่ตอนนี้
(ปัจจุบันเป็นแค่ Phase 0 - foundation/scaffold เท่านั้น ยังไม่มี Prisma model หรือ business logic ใดๆ)

งานที่ต้องการตอนนี้คือ Phase 1: Organization Structure (Faculty → Department → Program → Curriculum)
ตามรายละเอียดในข้อ 3, 4, 5, 6 ของ PROJECT_CONTEXT.md

ก่อน implement ให้ตอบกลับมาก่อนว่า:
1. Prisma models ที่จะเพิ่ม (Faculty, Department, Program, Curriculum) พร้อม field และความสัมพันธ์
2. Backend validation logic สำหรับ dependent relationship (Department ต้องอยู่ใน Faculty ที่ถูกต้อง, Program ต้องอยู่ใน Department ที่ถูกต้อง, Curriculum ต้องอยู่ใน Program ที่ถูกต้อง)
3. ไฟล์/module ที่จะสร้างหรือแก้ (organization module: controller, service, DTO)
4. Security considerations (ใครมีสิทธิ์ CRUD ส่วนนี้ตามข้อ 12 - SUPER_ADMIN)
5. รออนุมัติจากฉันก่อน ห้าม implement ทันที

ห้ามรัน migration หรือแก้ database จนกว่าจะได้รับอนุมัติ