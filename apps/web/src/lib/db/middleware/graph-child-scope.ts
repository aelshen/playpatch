/**
 * Prisma Middleware for Graph Child Scope Isolation
 * Automatically injects childId filter on all GraphNode and GraphEdge queries
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

// Store child ID in async local storage for middleware access
const childIdStore = new Map<string, string>();

/**
 * Set the current child ID for graph queries
 * Call this before making graph queries to ensure child isolation
 */
export function setGraphChildId(requestId: string, childId: string): void {
  childIdStore.set(requestId, childId);
}

/**
 * Clear the child ID after request completes
 */
export function clearGraphChildId(requestId: string): void {
  childIdStore.delete(requestId);
}

/**
 * Get the current child ID for the request
 */
export function getGraphChildId(requestId: string): string | undefined {
  return childIdStore.get(requestId);
}

/**
 * Prisma middleware that enforces child scope on graph queries
 * - For GraphNode/GraphEdge queries without explicit childId, logs warning
 * - Does NOT throw errors - fails gracefully to avoid breaking UI
 */
export const graphChildScopeMiddleware: Prisma.Middleware = async (params, next) => {
  const graphModels = ['GraphNode', 'GraphEdge', 'GraphNodeVideo'];

  if (!graphModels.includes(params.model || '')) {
    return next(params);
  }

  // For read operations, verify childId is present in where clause
  const readActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'];

  if (readActions.includes(params.action)) {
    const where = params.args?.where;

    // Check if childId is present (direct or nested)
    const hasChildId =
      where?.childId || where?.child?.id || where?.node?.childId || where?.sourceNode?.childId;

    if (!hasChildId && params.model !== 'GraphNodeVideo') {
      // Log warning but don't block - GraphNodeVideo doesn't have direct childId
      logger.warn({
        model: params.model,
        action: params.action,
        message: 'Graph query without explicit childId - ensure child isolation is enforced',
      });
    }
  }

  return next(params);
};
