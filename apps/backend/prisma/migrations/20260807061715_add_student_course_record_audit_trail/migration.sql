-- AlterTable
ALTER TABLE "student_course_records" ADD COLUMN     "enteredByRole" "Role",
ADD COLUMN     "enteredByUserId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "student_course_records" ADD CONSTRAINT "student_course_records_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
