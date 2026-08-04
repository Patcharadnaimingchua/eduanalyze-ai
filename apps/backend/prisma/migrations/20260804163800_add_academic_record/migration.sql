-- CreateEnum
CREATE TYPE "SemesterTerm" AS ENUM ('FIRST', 'SECOND', 'SUMMER');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B_PLUS', 'B', 'C_PLUS', 'C', 'D_PLUS', 'D', 'F', 'W', 'I', 'S', 'U');

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "term" "SemesterTerm" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_course_records" (
    "id" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,

    CONSTRAINT "student_course_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_key" ON "academic_years"("year");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_academicYearId_term_key" ON "semesters"("academicYearId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "student_course_records_studentProfileId_courseId_semesterId_key" ON "student_course_records"("studentProfileId", "courseId", "semesterId");

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_records" ADD CONSTRAINT "student_course_records_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_records" ADD CONSTRAINT "student_course_records_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_records" ADD CONSTRAINT "student_course_records_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

