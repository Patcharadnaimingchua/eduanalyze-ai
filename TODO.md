# TODO

## Observations & Data Issues

### H9-H11 Testing (2026-09-29)
Found 1 pre-existing STAFF account without scope assignment:
- Email: `patcharadnaimingchua+eduanalyze-test@gmail.com`
- Roles: STAFF
- Scopes: 0
- Status: Active
- Query: SELECT u.email, string_agg(distinct r.role::text, ',') roles, count(distinct s.id) scopes FROM users u LEFT JOIN user_roles r ON r."userId"=u.id LEFT JOIN user_scopes s ON s."userId"=u.id WHERE u.email LIKE 'patcharadnaimingchua+%' GROUP BY u.email

**Decision needed**: Is this a pre-existing data gap (scope should be assigned)? The backend rejects STAFF/ADMIN without scope on all access paths (`isCovered` check in UserScopeService). No operational impact during H9-H11 read-only browser testing because the account is never accessed, but should be audited and either:
1. Remove STAFF role and keep as STUDENT-only, OR
2. Assign an appropriate scope (Faculty/Department/Program)

---

## Backend & Data Issues

### On-track by Year Level (M20 deferred)
M20 was closed with "เหลืออีก X หน่วยกิต" (no year-aware judgement). A real "on track for my year" indicator needs an expected-credits rule, which the schema does not have (no `Curriculum.durationYears`, no `Course.recommendedYear`):
- Schema-free option: behind if `creditsPassed < ceil(totalCredits × (yearLevel − 1) / 4)` (assumes 4-year programs).
- Schema option: add `Curriculum.durationYears` (migration).

Prerequisite: the year-level formula (`currentAcademicYear − admissionYear + 1`, clamped 1-4) lives in three places — `DashboardService.bucketByYearLevel`, `StudentCourseRecordService.resolveYearLevelAt`, and the frontend academic-years page. Extract one shared helper first (CONVENTIONS §6). Also affects Year Level Overview (STAFF/INSTRUCTOR) if a "behind" count is wanted there.

---

