-- CreateTable
CREATE TABLE "GraphNode" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "category" TEXT,
    "totalWatchTime" INTEGER NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphNodeVideo" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphNodeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GraphNode_childId_idx" ON "GraphNode"("childId");

-- CreateIndex
CREATE INDEX "GraphNode_childId_normalizedLabel_idx" ON "GraphNode"("childId", "normalizedLabel");

-- CreateIndex
CREATE INDEX "GraphNode_childId_category_idx" ON "GraphNode"("childId", "category");

-- CreateIndex
CREATE INDEX "GraphNode_childId_totalWatchTime_idx" ON "GraphNode"("childId", "totalWatchTime");

-- CreateIndex
CREATE INDEX "GraphEdge_childId_idx" ON "GraphEdge"("childId");

-- CreateIndex
CREATE INDEX "GraphEdge_sourceNodeId_idx" ON "GraphEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "GraphEdge_targetNodeId_idx" ON "GraphEdge"("targetNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "GraphEdge_childId_sourceNodeId_targetNodeId_key" ON "GraphEdge"("childId", "sourceNodeId", "targetNodeId");

-- CreateIndex
CREATE INDEX "GraphNodeVideo_nodeId_idx" ON "GraphNodeVideo"("nodeId");

-- CreateIndex
CREATE INDEX "GraphNodeVideo_videoId_idx" ON "GraphNodeVideo"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "GraphNodeVideo_nodeId_videoId_key" ON "GraphNodeVideo"("nodeId", "videoId");

-- AddForeignKey
ALTER TABLE "GraphNode" ADD CONSTRAINT "GraphNode_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphNodeVideo" ADD CONSTRAINT "GraphNodeVideo_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphNodeVideo" ADD CONSTRAINT "GraphNodeVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
