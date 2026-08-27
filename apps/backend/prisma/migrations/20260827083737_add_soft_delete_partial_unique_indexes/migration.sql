-- DropIndex
DROP INDEX "clos_courseId_code_key";

-- DropIndex
DROP INDEX "course_categories_curriculumId_name_key";

-- DropIndex
DROP INDEX "courses_curriculumId_code_key";

-- DropIndex
DROP INDEX "curricula_programId_version_key";

-- DropIndex
DROP INDEX "departments_facultyId_code_key";

-- DropIndex
DROP INDEX "faculties_code_key";

-- DropIndex
DROP INDEX "plos_curriculumId_code_key";

-- DropIndex
DROP INDEX "programs_departmentId_code_key";

-- DropIndex
DROP INDEX "programs_departmentId_name_key";

-- DropIndex
DROP INDEX "semesters_academicYearId_term_key";

-- CreateIndex
-- Partial unique indexes: same fix as StudentCourseRecord
-- (20260826042955_add_student_course_record_partial_unique_index) applied
-- to the 9 remaining models that combine isActive soft-delete with a
-- natural-key @@unique. Prisma's schema-level @@unique has no syntax for a
-- filtered/partial index, so a soft-deleted row's natural key would
-- otherwise permanently block re-creating an active row with the same
-- key. Safe against existing data: the old plain unique index already
-- guaranteed at most one row per natural key (active or not), so there is
-- no possible duplicate for a partial index to trip over on creation.
CREATE UNIQUE INDEX "faculties_active_code_key"
  ON "faculties" ("code")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "departments_active_facultyId_code_key"
  ON "departments" ("facultyId", "code")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "programs_active_departmentId_name_key"
  ON "programs" ("departmentId", "name")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "programs_active_departmentId_code_key"
  ON "programs" ("departmentId", "code")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "curricula_active_programId_version_key"
  ON "curricula" ("programId", "version")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "course_categories_active_curriculumId_name_key"
  ON "course_categories" ("curriculumId", "name")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "courses_active_curriculumId_code_key"
  ON "courses" ("curriculumId", "code")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "plos_active_curriculumId_code_key"
  ON "plos" ("curriculumId", "code")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "clos_active_courseId_code_key"
  ON "clos" ("courseId", "code")
  WHERE "isActive" = true;

CREATE UNIQUE INDEX "semesters_active_academicYearId_term_key"
  ON "semesters" ("academicYearId", "term")
  WHERE "isActive" = true;
