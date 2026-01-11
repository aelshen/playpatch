-- CreateIndex
CREATE INDEX "AIConversation_startedAt_endedAt_idx" ON "AIConversation"("startedAt", "endedAt");

-- CreateIndex
CREATE INDEX "AIConversation_topics_idx" ON "AIConversation"("topics");

-- CreateIndex
CREATE INDEX "AIMessage_createdAt_conversationId_idx" ON "AIMessage"("createdAt", "conversationId");

-- CreateIndex
CREATE INDEX "AIMessage_wasFiltered_idx" ON "AIMessage"("wasFiltered");

-- CreateIndex
CREATE INDEX "Favorite_createdAt_idx" ON "Favorite"("createdAt");

-- CreateIndex
CREATE INDEX "RequestFromChild_createdAt_status_requestType_idx" ON "RequestFromChild"("createdAt", "status", "requestType");

-- CreateIndex
CREATE INDEX "WatchSession_startedAt_childId_idx" ON "WatchSession"("startedAt", "childId");
