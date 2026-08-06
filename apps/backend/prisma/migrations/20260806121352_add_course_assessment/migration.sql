-- CreateTable
CREATE TABLE "course_assessments" (
    "id" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "course_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_assessment_clo_scores" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "courseAssessmentId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,

    CONSTRAINT "course_assessment_clo_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_assessments_studentProfileId_courseId_key" ON "course_assessments"("studentProfileId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_assessment_clo_scores_courseAssessmentId_cloId_key" ON "course_assessment_clo_scores"("courseAssessmentId", "cloId");

-- AddForeignKey
ALTER TABLE "course_assessments" ADD CONSTRAINT "course_assessments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assessments" ADD CONSTRAINT "course_assessments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assessment_clo_scores" ADD CONSTRAINT "course_assessment_clo_scores_courseAssessmentId_fkey" FOREIGN KEY ("courseAssessmentId") REFERENCES "course_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assessment_clo_scores" ADD CONSTRAINT "course_assessment_clo_scores_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "clos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
