-- AlterTable
ALTER TABLE "curricula" ADD COLUMN     "totalCredits" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "course_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumId" TEXT NOT NULL,

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_requirements" (
    "id" TEXT NOT NULL,
    "minCredits" INTEGER NOT NULL,
    "minCourses" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "curriculum_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequisites" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteCourseId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_curriculumId_name_key" ON "course_categories"("curriculumId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_curriculumId_id_key" ON "course_categories"("curriculumId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_curriculumId_code_key" ON "courses"("curriculumId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_requirements_categoryId_key" ON "curriculum_requirements"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_requirements_curriculumId_categoryId_key" ON "curriculum_requirements"("curriculumId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "prerequisites_courseId_prerequisiteCourseId_key" ON "prerequisites"("courseId", "prerequisiteCourseId");

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_curriculumId_categoryId_fkey" FOREIGN KEY ("curriculumId", "categoryId") REFERENCES "course_categories"("curriculumId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_requirements_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_requirements" ADD CONSTRAINT "curriculum_requirements_curriculumId_categoryId_fkey" FOREIGN KEY ("curriculumId", "categoryId") REFERENCES "course_categories"("curriculumId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequisites" ADD CONSTRAINT "prerequisites_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

