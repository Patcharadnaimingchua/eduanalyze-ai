-- CreateTable
CREATE TABLE "student_invitations" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_invitations_tokenHash_key" ON "student_invitations"("tokenHash");

-- AddForeignKey
ALTER TABLE "student_invitations" ADD CONSTRAINT "student_invitations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invitations" ADD CONSTRAINT "student_invitations_programId_curriculumId_fkey" FOREIGN KEY ("programId", "curriculumId") REFERENCES "curricula"("programId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_invitations" ADD CONSTRAINT "student_invitations_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
