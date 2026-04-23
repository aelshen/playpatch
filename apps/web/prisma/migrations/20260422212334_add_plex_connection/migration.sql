-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'PLEX';

-- CreateTable
CREATE TABLE "PlexConnection" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "serverUrl" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "serverName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlexConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlexConnection_familyId_key" ON "PlexConnection"("familyId");

-- AddForeignKey
ALTER TABLE "PlexConnection" ADD CONSTRAINT "PlexConnection_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
