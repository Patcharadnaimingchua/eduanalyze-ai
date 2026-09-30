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

### Soft-deleted Academic Year Blocks Recreation (M16 deferred)
Trying to recreate an academic year that was soft-deleted (deleted via the UI but not hard-deleted from DB) fails silently or returns a 409 conflict error.

**Context**: M16 adds flexible bulk year creation, but the soft-deleted-year check is a backend issue that requires:
- Database migration to handle soft-deleted years in the duplicate-check query, OR
- UI workaround to hard-delete before allowing recreation

**Decision needed**: Defer to a future issue (not in M-series scope). For now, users must contact an admin to hard-delete if they need to recreate a soft-deleted year.

---

