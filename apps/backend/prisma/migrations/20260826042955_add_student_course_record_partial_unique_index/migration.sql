-- DropIndex
DROP INDEX "student_course_records_studentProfileId_courseId_semesterId_key";

-- CreateIndex
-- Partial unique index: uniqueness on (studentProfileId, courseId,
-- semesterId) is enforced only among isActive:true rows, so a
-- soft-deleted row no longer blocks re-creating a record for the same
-- student+course+semester. Safe against existing data — the old
-- non-partial constraint already guaranteed at most one row per
-- (studentProfileId, courseId, semesterId) combo, active or not, so there
-- is no possible duplicate for this index to trip over on creation.
CREATE UNIQUE INDEX "student_course_records_active_unique_key"
  ON "student_course_records" ("studentProfileId", "courseId", "semesterId")
  WHERE "isActive" = true;
