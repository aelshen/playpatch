-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('MORE_LIKE_THIS', 'SPECIFIC_TOPIC', 'NEW_CHANNEL', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'FULFILLED', 'DISMISSED');

-- CreateTable
CREATE TABLE "RequestFromChild" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "videoId" TEXT,
    "requestType" "RequestType" NOT NULL DEFAULT 'MORE_LIKE_THIS',
    "message" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestFromChild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestFromChild_childId_idx" ON "RequestFromChild"("childId");

-- CreateIndex
CREATE INDEX "RequestFromChild_videoId_idx" ON "RequestFromChild"("videoId");

-- CreateIndex
CREATE INDEX "RequestFromChild_status_idx" ON "RequestFromChild"("status");

-- AddForeignKey
ALTER TABLE "RequestFromChild" ADD CONSTRAINT "RequestFromChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestFromChild" ADD CONSTRAINT "RequestFromChild_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
