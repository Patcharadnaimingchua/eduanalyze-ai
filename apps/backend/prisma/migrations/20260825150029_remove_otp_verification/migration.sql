-- DropForeignKey
ALTER TABLE "otp_codes" DROP CONSTRAINT "otp_codes_userId_fkey";

-- DropTable
DROP TABLE "otp_codes";

-- DropEnum
DROP TYPE "OtpPurpose";
