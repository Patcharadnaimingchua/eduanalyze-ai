-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('PASSWORD', 'GOOGLE');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_auth_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_methods_userId_provider_key" ON "user_auth_methods"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_methods_provider_providerUserId_key" ON "user_auth_methods"("provider", "providerUserId");

-- AddForeignKey
ALTER TABLE "user_auth_methods" ADD CONSTRAINT "user_auth_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

