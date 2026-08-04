-- AlterTable
ALTER TABLE "curricula" ADD COLUMN     "defaultAchievementThreshold" INTEGER NOT NULL DEFAULT 70;

-- CreateTable
CREATE TABLE "plos" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumId" TEXT NOT NULL,

    CONSTRAINT "plos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clos" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "achievementThreshold" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "clos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clo_plo_mappings" (
    "id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cloId" TEXT NOT NULL,
    "ploId" TEXT NOT NULL,

    CONSTRAINT "clo_plo_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plos_curriculumId_code_key" ON "plos"("curriculumId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "clos_courseId_code_key" ON "clos"("courseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "clo_plo_mappings_cloId_ploId_key" ON "clo_plo_mappings"("cloId", "ploId");

-- AddForeignKey
ALTER TABLE "plos" ADD CONSTRAINT "plos_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clos" ADD CONSTRAINT "clos_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "clos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_ploId_fkey" FOREIGN KEY ("ploId") REFERENCES "plos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

