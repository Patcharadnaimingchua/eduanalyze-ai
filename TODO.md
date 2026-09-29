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

