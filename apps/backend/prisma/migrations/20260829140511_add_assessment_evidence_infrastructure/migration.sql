-- CreateEnum
CREATE TYPE "MissingScorePolicy" AS ENUM ('EXCLUDE', 'TREAT_AS_ZERO');

-- CreateEnum
CREATE TYPE "AssessmentScoreStatus" AS ENUM ('PENDING', 'GRADED', 'ABSENT', 'EXCUSED');

-- CreateTable
CREATE TABLE "assessment_definitions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "maxScore" DECIMAL(6,2) NOT NULL,
    "missingScorePolicy" "MissingScorePolicy" NOT NULL DEFAULT 'EXCLUDE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,

    CONSTRAINT "assessment_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_clo_mappings" (
    "id" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "maxScoreOverride" DECIMAL(6,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assessmentDefinitionId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,

    CONSTRAINT "assessment_clo_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_assessment_scores" (
    "id" TEXT NOT NULL,
    "score" DECIMAL(6,2),
    "status" "AssessmentScoreStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assessmentCloMappingId" TEXT NOT NULL,
    "studentCourseRecordId" TEXT NOT NULL,

    CONSTRAINT "student_assessment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_assessment_scores_assessmentCloMappingId_studentCou_key" ON "student_assessment_scores"("assessmentCloMappingId", "studentCourseRecordId");

-- AddForeignKey
ALTER TABLE "assessment_definitions" ADD CONSTRAINT "assessment_definitions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_definitions" ADD CONSTRAINT "assessment_definitions_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_clo_mappings" ADD CONSTRAINT "assessment_clo_mappings_assessmentDefinitionId_fkey" FOREIGN KEY ("assessmentDefinitionId") REFERENCES "assessment_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_clo_mappings" ADD CONSTRAINT "assessment_clo_mappings_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "clos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessment_scores" ADD CONSTRAINT "student_assessment_scores_assessmentCloMappingId_fkey" FOREIGN KEY ("assessmentCloMappingId") REFERENCES "assessment_clo_mappings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessment_scores" ADD CONSTRAINT "student_assessment_scores_studentCourseRecordId_fkey" FOREIGN KEY ("studentCourseRecordId") REFERENCES "student_course_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
-- Partial unique index (CONVENTIONS.md §7): assessment_clo_mappings
-- combines isActive soft-delete with a natural-key uniqueness rule
-- (one mapping per assessment+CLO pair), which a plain schema-level
-- @@unique cannot express correctly — it would permanently block
-- re-creating a soft-deleted mapping. Safe against existing data: this
-- table is brand new in this same migration, so there are zero rows for
-- a partial index to conflict with.
CREATE UNIQUE INDEX "assessment_clo_mappings_active_definition_clo_key"
  ON "assessment_clo_mappings" ("assessmentDefinitionId", "cloId")
  WHERE "isActive" = true;
