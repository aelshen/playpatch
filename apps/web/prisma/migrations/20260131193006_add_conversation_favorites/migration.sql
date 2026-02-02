-- AlterTable
ALTER TABLE "AIConversation" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "AIConversation_childId_startedAt_idx" ON "AIConversation"("childId", "startedAt");

-- CreateIndex
CREATE INDEX "AIConversation_videoId_childId_idx" ON "AIConversation"("videoId", "childId");

-- CreateIndex
CREATE INDEX "AIConversation_childId_isFavorite_idx" ON "AIConversation"("childId", "isFavorite");
