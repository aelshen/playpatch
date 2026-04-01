# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- kebab-case for file names: `video-player.tsx`, `age-rating.ts`, `channel-sync.ts`
- Index files for module exports: `index.ts` in `auth/`, `ai/`, `db/queries/`
- File naming reflects functionality: `videos.ts` for video queries, `register-form.tsx` for registration UI

**Functions:**
- camelCase for all functions: `getVideosByFamily()`, `createVideoAction()`, `checkAllServices()`
- Prefix utility functions with purpose: `can*()` for boolean checks (e.g., `canChildViewVideo()`)
- Prefix with `get*()` for query/fetch operations (e.g., `getVideoById()`, `getRecommendedVideos()`)
- Prefix with `create*()`, `update*()`, `delete*()` for mutations
- Server actions use `*Action` suffix: `createVideoAction()`, `updateVideoAction()`, `approveVideoAction()`

**Variables:**
- camelCase for all variable names: `familyId`, `childProfileId`, `mockVideos`
- Prefix boolean variables with `is*` or `has*`: `isHealthy`, `hasCategories`
- Constants use UPPER_SNAKE_CASE: `MAX_LIMIT`, `WEIGHTS`, `VIDEO_DEFAULTS`, `BUCKETS`
- Private/internal variables sometimes use underscore prefix: `_prevState` for unused server action parameters

**Types:**
- PascalCase for TypeScript types: `VideoWithChannel`, `RecommendationParams`, `ScoredVideo`, `VideoActionState`
- Types defined near their usage location
- Explicit export of type definitions: `export type`, `export interface`

## Code Style

**Formatting:**
- Prettier v3.2.5 configured with:
  - 2-space indentation (`tabWidth: 2`)
  - Single quotes for strings (`singleQuote: true`)
  - 100-character line width (`printWidth: 100`)
  - Trailing commas with ES5 compatibility (`trailingComma: "es5"`)
  - Semicolons required (`semi: true`)
  - Always include arrow function parentheses (`arrowParens: "always"`)
  - LF line endings (`endOfLine: "lf"`)
  - Tailwind CSS plugin enabled (`prettier-plugin-tailwindcss`)

- Run formatting: `pnpm format`
- Check formatting: `pnpm format:check`

**Linting:**
- ESLint with Next.js configuration
- Config file: `.eslintrc.js` at project root
- Extended configs:
  - `eslint:recommended`
  - `plugin:@typescript-eslint/recommended`
  - `plugin:react/recommended`
  - `plugin:react-hooks/recommended`
  - `next/core-web-vitals`
  - `prettier` (disables ESLint formatting rules)

- Key rules:
  - Unused variables: error, with `_` prefix exemption for unused parameters
  - `any` type usage: warn
  - React JSX scope: off (React 18+ doesn't require import)
  - React PropTypes: off (using TypeScript instead)

- Run linting: `pnpm lint`
- Fix issues: `pnpm lint:fix`

## Import Organization

**Order:**
1. External packages (e.g., `import { z } from 'zod'`, `import pino from 'pino'`)
2. Next.js utilities (e.g., `import { NextResponse } from 'next/server'`, `import { useRouter } from 'next/navigation'`)
3. Internal project utilities (e.g., `import type { Video } from '@prisma/client'`)
4. Local relative imports (e.g., `import { getVideosByFamily } from '@/lib/db/queries/videos'`)
5. Type imports separated: `import type { ... } from '@/types'`

**Path Aliases:**
- `@/*` maps to `./src/*` - use this for all internal imports
- Example: `@/lib/db/queries/videos` resolves to `./apps/web/src/lib/db/queries/videos`
- Avoid relative paths like `../../` - always use `@/` alias

## Error Handling

**Patterns:**
- Try-catch blocks wrap async operations in server actions and API routes
- Errors logged via `logger` (Pino instance) before returning to user
- Specific error messages returned to client for user feedback
- Sensitive error details NOT exposed to client
- Default error response example from `getVideoId()`:
  ```typescript
  if (!video) {
    throw new Error('Video not found');
  }
  ```
- Graceful degradation: some services (e.g., storage checks) don't throw, return status instead
- Server actions return `ActionState` type with `error?: string` or `success?: boolean`

## Logging

**Framework:** Pino v8.18.0

**Configuration:** `src/lib/logger.ts`
- Log level: `debug` in development, `info` in production
- Sensitive fields redacted automatically:
  - `password`, `pin`, `sessionId`, `token`, `secret`, `apiKey`
- Logger is a singleton: `import { logger } from '@/lib/logger'`

**Patterns:**
- Use `logger.info()` for normal operations
- Use `logger.error()` for error cases with context
- Use `logger.warn()` for warnings
- Use `logger.debug()` for development debugging only
- Example: `logger.error('Create video error:', error)`

## Comments

**When to Comment:**
- File header comments: Purpose of module and SSK reference (e.g., `SSK-036: Video CRUD Operations`)
- Complex algorithm explanations
- Business logic rationale
- Integration points with external services

**JSDoc/TSDoc:**
- Used extensively for exported functions and types
- Example pattern:
  ```typescript
  /**
   * Get all videos for a family with filtering
   */
  export async function getVideosByFamily(params: { ... }) {
  ```
- Function parameter documentation optional but recommended for complex operations
- Type documentation includes examples where helpful

**File Headers:**
All files include a documentation comment at the top:
```typescript
/**
 * [Purpose/description]
 * [SSK reference if applicable]
 */
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Database query functions typically 20-50 lines
- Component functions vary widely (30-200+ lines depending on complexity)
- Server action functions 50-100 lines typical

**Parameters:**
- Use object parameters for functions with multiple arguments
- Example: `getVideosByFamily({ familyId, status, limit })`
- Parameters typed explicitly: `{ familyId: string; limit?: number }`
- Optional parameters use `?` in type signature

**Return Values:**
- Explicit return types on all functions: `async function getName(): Promise<Type> { }`
- Nullable returns use `| null`: `Promise<Video | null>`
- Array returns use `Promise<Type[]>`
- Action state returns use defined type: `Promise<VideoActionState>`

## Module Design

**Exports:**
- Named exports preferred over default exports
- Example: `export function getVideosByFamily(...)` not `export default getVideosByFamily`
- Type exports separated: `export type VideoActionState = { ... }`

**Barrel Files:**
- Index files aggregate and re-export: `src/lib/db/queries/index.ts`
- Not all directories have barrel files - only where it makes sense for API surface
- Optional re-exports allowed for common utilities

**Organization:**
- Keep related functions in same file: video queries in `queries/videos.ts`
- Shared types in `types/` directory
- Utilities in `utils/` by category: `utils/age-rating.ts`, `utils/shared.ts`
- Mocks in `__mocks__/` directory: `__mocks__/prisma.ts`

---

*Convention analysis: 2026-01-22*
