-- AlterTable: Add unique constraint on GraphNode (childId, normalizedLabel)
-- This enables Prisma upsert operations in graph builder service

-- Drop existing index (will be replaced by unique constraint)
DROP INDEX IF EXISTS "GraphNode_childId_normalizedLabel_idx";

-- Add unique constraint
ALTER TABLE "GraphNode" ADD CONSTRAINT "GraphNode_childId_normalizedLabel_key" UNIQUE ("childId", "normalizedLabel");
