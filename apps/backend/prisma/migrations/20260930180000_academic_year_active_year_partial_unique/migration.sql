-- DropIndex
DROP INDEX "academic_years_year_key";

-- Soft-delete convention (CONVENTIONS.md §7): uniqueness only among active
-- rows, so a soft-deleted year can be created again. Missed by
-- 20260827083737_add_soft_delete_partial_unique_indexes.
CREATE UNIQUE INDEX "academic_years_active_year_key" ON "academic_years" ("year") WHERE "isActive" = true;
