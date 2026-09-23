-- CreateEnum
CREATE TYPE "CreditLimitRequestType" AS ENUM ('EXCEED_MAX', 'BELOW_MIN');

-- CreateTable
CREATE TABLE "student_credit_limit_requests" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "type" "CreditLimitRequestType" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_credit_limit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_credit_limit_requests_studentProfileId_key" ON "student_credit_limit_requests"("studentProfileId");

-- AddForeignKey
ALTER TABLE "student_credit_limit_requests" ADD CONSTRAINT "student_credit_limit_requests_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
