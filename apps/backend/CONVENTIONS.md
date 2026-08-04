# EduAnalyzeAI — Backend Conventions

Conventions every module follows starting Phase 1. Not enforced by tooling (yet) — reviewed by hand until a lint rule/CI check is worth adding.

## 1. Swagger / API Documentation

Every controller and DTO ships doc decorators in the same commit as the code, not as a follow-up.

```ts
@ApiTags('organization')
@Controller('faculties')
export class FacultyController {
  @Get(':id')
  @ApiOperation({ summary: 'Get a faculty by id' })
  @ApiResponse({ status: 200, description: 'Faculty found' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  findOne(@Param('id') id: string) { ... }
}

export class CreateFacultyDto {
  @ApiProperty({ example: 'Faculty of Engineering' })
  @IsString()
  name: string;
}
```

Rule: `@ApiTags` on every controller, `@ApiOperation` + success/error `@ApiResponse` on every route, `@ApiProperty` on every DTO field. Once auth lands (Phase 3), protected routes add `@ApiBearerAuth('access-token')`.

## 2. Naming Convention

| Thing | Pattern | Example |
|---|---|---|
| Module folder | `src/modules/<domain>/` | `src/modules/organization/` |
| Module file | `<domain>.module.ts` | `organization.module.ts` |
| Controller | `<domain>.controller.ts` → `<Domain>Controller` | `faculty.controller.ts` → `FacultyController` |
| Service | `<domain>.service.ts` → `<Domain>Service` | `faculty.service.ts` → `FacultyService` |
| DTO | `<action>-<entity>.dto.ts` → `<Action><Entity>Dto` | `create-faculty.dto.ts` → `CreateFacultyDto` |
| Prisma model | PascalCase singular | `Faculty`, `Department`, `Program` |
| Prisma field | camelCase | `facultyId`, `createdAt` |
| Route path | kebab-case plural | `/api/faculties`, `/api/curriculum-versions` |

One entity = one subfolder under its domain module when the domain has multiple entities (e.g. `organization/faculty/`, `organization/department/`), each with its own controller/service/dto — mirrors the existing `src/modules/`, `src/common/`, `src/prisma/` split from Phase 0.

## 3. Security Pattern — Guard Chain

Every endpoint that isn't public goes through the same three-stage chain, in this order: **Authentication → Role → Scope**. Never rely on Role alone.

```ts
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Roles('SUPER_ADMIN')
@Post()
create(@Body() dto: CreateFacultyDto) { ... }
```

- `JwtAuthGuard` — confirms the requester is authenticated (valid access token).
- `RolesGuard` + `@Roles(...)` — confirms the authenticated user's role is permitted for this route.
- `ScopeGuard` — confirms the user's role-scope (e.g. a Department Admin can only touch their own department) actually covers the target resource, not just the role name. This is the one most often forgotten — a role check alone (`SUPER_ADMIN` vs `DEPARTMENT_ADMIN`) says nothing about *which* department.

Guards are added in Phase 3 (auth) but the chain shape is fixed now so every module built before then still slots into it without rewrites.

### 3a. Self-Ownership Check (STUDENT-authored data)

Every module up to Phase 5 is `SUPER_ADMIN`-only CRUD, so `RolesGuard` alone was enough. Starting Phase 6 (`StudentCourseRecord`, and later Smart Credit Checker / Course Assessment), a `STUDENT` can create/read/update/delete their *own* rows only — a case `RolesGuard` cannot express, since it checks the role name, not which row the role owns.

**Where the check lives:** the service layer, never the controller — per §6, this is business logic (a branch on a domain value: does `studentProfile.userId` match the requester?), not orchestration.

**How it's implemented**, using `StudentCourseRecordService` as the reference shape:
- The controller passes the authenticated `RequestUser` (from `@Req()`/a `@CurrentUser()` decorator) through to every service method, alongside the DTO/id.
- `findAll(user)`: if `user.roles` includes `STUDENT` (and not `SUPER_ADMIN`), resolve `user.sub → studentProfile.id` first, then query with `where: { studentProfileId }` directly — **never** fetch all rows and filter in memory. Query-level filtering makes "forgot to filter" structurally impossible, not just a discipline problem for whoever edits this method next.
- `findOne(id, user)` / `update(id, dto, user)` / `remove(id, user)`: query with `where: { id, studentProfileId: ownStudentProfileId }` (STUDENT) or `where: { id }` (`SUPER_ADMIN`, no ownership filter). If the row isn't found under that `where`, throw `NotFoundException` — the exact same exception as a genuinely nonexistent id.
- **Never throw `ForbiddenException` (403) for "exists but not yours."** A 403 confirms the row exists, which is an information-disclosure leak (OWASP Broken Access Control) — whether the record exists and whether the requester owns it must be indistinguishable from the response.

## 4. Error Handling Convention

Throw Nest's built-in `HttpException` subclasses — never return error shapes manually from a controller.

```ts
if (!faculty) {
  throw new NotFoundException(`Faculty ${id} not found`);
}
if (dto.departmentId && !(await this.isValidDepartment(dto.departmentId, faculty.id))) {
  throw new BadRequestException('Department does not belong to the specified faculty');
}
```

Nest's default exception filter turns these into a consistent JSON shape:

```json
{ "statusCode": 404, "message": "Faculty <id> not found", "error": "Not Found" }
```

A global `AllExceptionsFilter` (added to `src/common/filters/`, referenced in `app.module.ts`) normalizes anything uncaught (e.g. Prisma errors) into the same shape — so the response contract never depends on which layer threw. Controllers/services never `try/catch` just to reformat an error; they only catch when they need to translate a lower-level error (e.g. Prisma's `P2025`) into the right `HttpException` subtype.

## 5. DTO Validation Convention

`main.ts` already sets:

```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```

Consequences for how DTOs must be written:
- **`whitelist: true`** strips any property not decorated in the DTO — so every field the client may legitimately send needs a `class-validator` decorator, or it silently disappears.
- **`forbidNonWhitelisted: true`** rejects the request (400) if the client sends an undeclared property — DTOs are the literal contract, not a loose shape.
- **`transform: true`** auto-converts payloads to the DTO class and coerces primitive types — so `@IsInt()` on a route param works without manual `parseInt`.

```ts
export class CreateFacultyDto {
  @ApiProperty({ example: 'Faculty of Engineering' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ENG' })
  @IsString()
  @Length(1, 10)
  code: string;
}
```

Every DTO field pairs a `class-validator` decorator with an `@ApiProperty` — the two are written together, not one added later.

## 6. Business Logic Placement

All calculation logic (GPA, CLO/PLO achievement, radar values, any derived score) lives in the **service layer only**. Controllers call one service method and return its result — they never compute, aggregate, or branch on domain values themselves.

```ts
// Controller — orchestration only
@Get(':studentId/gpa')
getGpa(@Param('studentId') studentId: string) {
  return this.transcriptService.calculateGpa(studentId);
}

// Service — the only place calculation logic lives
@Injectable()
export class TranscriptService {
  calculateGpa(studentId: string): Promise<number> { ... }
}
```

If two controllers need the same number (e.g. GPA shown on a student profile *and* on an advisor dashboard), both call the same service method — the calculation is never reimplemented or copy-pasted at a second call site. This matters most for the analytics endpoints (GPA, CLO/PLO achievement) since AI only interprets already-computed results and must never see two different code paths producing the same metric.

## 7. Soft-Delete Convention (Hierarchy Entities)

Every entity in the Faculty → Department → Program → Curriculum chain soft-deletes via `isActive = false`, never a hard delete (matches `onDelete: Restrict` on every parent relation in `schema.prisma`). Before flipping `isActive` to `false`, the service must count the entity's *active* children and refuse with a `ConflictException` if any exist — never let a parent go inactive while active children still point at it.

```ts
async remove(id: string) {
  await this.findOne(id);

  const activeChildCount = await this.prisma.department.count({
    where: { facultyId: id, isActive: true },
  });
  if (activeChildCount > 0) {
    throw new ConflictException(
      `Cannot deactivate faculty ${id}: ${activeChildCount} active department(s) still belong to it`,
    );
  }

  return this.prisma.faculty.update({ where: { id }, data: { isActive: false } });
}
```

Same shape for every level down the chain: `DepartmentService.remove` counts active `Program`s, `ProgramService.remove` counts active `Curriculum`s. The error message always states the exact count of blocking children, not just that deletion failed.

The real rule for choosing soft- vs hard-delete on a new entity is not "is it a mapping table" — it's whether the entity is a parameter of a calculation that gets shown to users and needs to stay reproducible over time. `Course`/`CourseCategory`/`Curriculum` are soft-delete because deleting them would break Smart Credit Checker results for students who already took that course. `Prerequisite` is hard-delete because it's a pure boolean structural gate with no accumulated value. `CloPloMapping` is soft-delete for the same reason as `Course`: it directly parameterizes Achievement/PLO % calculations that feed Radar Charts and trend analytics (§23), so losing an old mapping row would make a previously-shown dashboard value unreproducible.

**Known limitation, tracked for the Achievement calculation phase:** `CloPloMapping`'s `isActive` flag only protects against the mapping being *deleted*. It does **not** provide a full audit trail — if `weight` (or a CLO's `achievementThreshold`) is edited in place, `updatedAt` overwrites the previous value with no history kept. When the Achievement calculation phase (PROJECT_CONTEXT.md §22–23) is designed, revisit whether that's good enough or whether Achievement results need to be persisted as a snapshot (e.g. an `AchievementSnapshot`/`AchievementDetail` table that copies the `weight`/`achievementThreshold` values used at calculation time) so historical dashboard values stay stable even if a mapping is edited later, not just deleted.

## 8. Scope Resolution Rule (Phase 3 onward)

Every time a user's real permissions are resolved from `UserScope`, the resolver must join and check `isActive` on whichever `Faculty`/`Department`/`Program` that scope points to — via the `findActiveByIdOrThrow` pattern or equivalent. Never treat the mere existence of a `UserScope` row as proof the permission is still valid.

**Why:** `onDelete: Restrict` on `UserScope`'s parent relations only blocks *hard* deletes — it does nothing for soft-delete (`isActive = false`), since that's a plain `UPDATE`, not a `DELETE`, and never touches the primary key the FK constraint watches. A `UserScope` pointing at a `Faculty`/`Department`/`Program` that has since been soft-deleted stays in the database untouched — a dangling reference at the business-logic level, even though the schema considers it perfectly valid.

```ts
// Wrong: trusts the row's existence alone
const scopes = await this.prisma.userScope.findMany({ where: { userId } });

// Right: resolves against current isActive state of the scoped entity
const scopes = await this.prisma.userScope.findMany({
  where: { userId },
  include: { faculty: true, department: true, program: true },
});
const effectiveScopes = scopes.filter(
  (s) => s.faculty?.isActive !== false &&
         s.department?.isActive !== false &&
         s.program?.isActive !== false,
);
```
