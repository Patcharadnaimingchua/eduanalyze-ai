-- CreateTable
CREATE TABLE "pending_invitations" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_invitations_tokenHash_key" ON "pending_invitations"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "pending_invitations_userId_key" ON "pending_invitations"("userId");

-- AddForeignKey
ALTER TABLE "pending_invitations" ADD CONSTRAINT "pending_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
