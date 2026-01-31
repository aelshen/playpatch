# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `apps/web/jest.config.js`
- Next.js integration via `next/jest`

**Assertion Library:**
- Jest built-in matchers: `expect(value).toBe()`, `expect(array).toHaveLength()`, etc.
- Testing Library matchers via `@testing-library/jest-dom` 6.9.1
- Mock extended via `jest-mock-extended` 3.0.5 for type-safe mocking

**Run Commands:**
```bash
pnpm test                 # Run all tests
pnpm test:watch         # Watch mode - re-run on file changes
pnpm test:coverage      # Generate coverage report
pnpm test:ci            # CI mode with coverage and 2 workers
```

**Environment:**
- Test environment: `jest-environment-jsdom` for DOM testing
- Setup file: `jest.setup.js` runs before all tests
- Path aliases: `@/*` mapped to `src/*` in tests

## Test File Organization

**Location:**
- Tests co-located in `__tests__/` directory structure mirroring `src/`
- Example: `src/__tests__/lib/db/queries/videos.test.ts` tests `src/lib/db/queries/videos.ts`
- Integration tests in `__tests__/integration/` subdirectory
- Unit tests in `__tests__/lib/` subdirectory

**Naming:**
- Test files: `*.test.ts` or `*.spec.ts` suffix
- Example filenames: `videos.test.ts`, `health.test.ts`, `engine.test.ts`

**Directory Structure:**
```
apps/web/src/
├── __tests__/
│   ├── lib/
│   │   ├── db/
│   │   │   └── queries/
│   │   │       └── videos.test.ts
│   │   ├── health/
│   │   │   └── checks.test.ts
│   │   ├── utils/
│   │   │   └── age-rating.test.ts
│   │   ├── constants/
│   │   │   └── video.test.ts
│   │   └── recommendations/
│   │       └── engine.test.ts
│   └── integration/
│       └── api/
│           ├── health.test.ts
│           └── recommendations.test.ts
├── lib/
│   ├── __mocks__/
│   │   └── prisma.ts
│   └── ...
└── ...
```

## Test Structure

**Suite Organization:**
```typescript
describe('Video Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVideosByFamily', () => {
    it('should return videos with pagination', async () => {
      // Test implementation
    });

    it('should enforce maximum pagination limit', async () => {
      // Test implementation
    });
  });

  describe('getVideoById', () => {
    it('should return video with relations', async () => {
      // Test implementation
    });
  });
});
```

**Patterns:**
- Top-level `describe()` for module or function group
- Nested `describe()` for each function being tested
- `it()` for individual test cases with descriptive names starting with "should"
- `beforeEach()` to reset all mocks between tests: `jest.clearAllMocks()`
- No `afterEach()` - use `beforeEach()` for cleanup

**Setup/Teardown:**
- Global setup in `jest.setup.js`:
  - Mock Next.js router: `jest.mock('next/navigation')`
  - Mock logger: `jest.mock('@/lib/logger')`
  - Mock environment variables
  - Import testing library matchers

- Per-test setup via `beforeEach()`:
  - Clear all mocks: `jest.clearAllMocks()`
  - Re-setup specific mocks for test scenario

## Mocking

**Framework:** `jest-mock-extended` with deep mocking support

**Patterns:**
```typescript
// Mock Prisma client with jest-mock-extended
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// In test files, setup mocks before each test
jest.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));

// Configure mock behavior in tests
prismaMock.video.findMany.mockResolvedValue(mockVideos);
prismaMock.video.count.mockResolvedValue(1);

// Verify mock calls with matchers
expect(prismaMock.video.findMany).toHaveBeenCalledWith(
  expect.objectContaining({ where: { familyId: 'family-1' } })
);
```

**Mock Location Patterns:**
- Prisma mock: `src/lib/__mocks__/prisma.ts`
- Route mocks: Setup in test via `jest.mock()` near top of test file
- External service mocks (Redis, storage, search): Mocked in test setup

**What to Mock:**
- Database calls (Prisma) - always mock, never use real DB
- External APIs (OpenAI, Meilisearch) - mock for unit tests
- File system operations (storage) - mock to avoid side effects
- Next.js router/navigation - mocked in `jest.setup.js`
- Logger - mocked in `jest.setup.js` to reduce console noise

**What NOT to Mock:**
- Core utility functions - test them directly
- Business logic functions that don't have side effects
- Type definitions - they're compile-time only
- Pure calculations and transformations

## Fixtures and Factories

**Test Data:**
```typescript
// Inline test data for small amounts
const mockVideos: Partial<Video>[] = [
  {
    id: 'video-1',
    title: 'Test Video 1',
    familyId: 'family-1',
    status: 'READY',
    approvalStatus: 'APPROVED',
  },
];

// Setup mock returns
prismaMock.video.findMany.mockResolvedValue(mockVideos as Video[]);

// Type partial during creation to avoid requiring all fields
const mockCreated: Partial<Video> = { id: 'video-1', ...videoData };
```

**Location:**
- Test fixtures defined inline in test files
- Shared test utilities in `jest.setup.js` if used across multiple tests
- Mock implementations in `__mocks__/` directory for large shared mocks

## Coverage

**Requirements:**
- Minimum 70% threshold configured in `jest.config.js`:
  - branches: 70%
  - functions: 70%
  - lines: 70%
  - statements: 70%

**Excluded from Coverage:**
- API routes (`src/app/api/**`)
- Type definitions (`**/*.d.ts`)
- Storybook files (`**/*.stories.{js,jsx,ts,tsx}`)
- Test files themselves (`**/__tests__/**`)
- Type directories (`**/types/**`)

**View Coverage:**
```bash
pnpm test:coverage
# Opens coverage report (check coverage/ directory)
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Mock all dependencies, test function in isolation
- Location: `src/__tests__/lib/utils/*.test.ts`, `src/__tests__/lib/db/queries/*.test.ts`
- Example: `videos.test.ts` tests each database query function individually
- Typical test count: 50-100+ tests per module

**Integration Tests:**
- Scope: API routes with mocked services
- Approach: Test actual route handler with mocked Prisma, logger, etc.
- Location: `src/__tests__/integration/api/*.test.ts`
- Example: `health.test.ts` tests `/api/health` route with various mock states
- Typical test count: 10-20 tests per endpoint

**E2E Tests:**
- Framework: Playwright 1.42.1
- Status: Not configured in main test suite
- Would run: `pnpm test:e2e` (defined in root package.json)
- Location: Would be separate test files with `.e2e` or `.pw` naming

## Common Patterns

**Async Testing:**
```typescript
// Always use async/await with async functions
it('should return video with pagination', async () => {
  prismaMock.video.findMany.mockResolvedValue(mockVideos as Video[]);
  prismaMock.video.count.mockResolvedValue(1);

  const result = await getVideosByFamily({
    familyId: 'family-1',
    limit: 20,
    offset: 0,
  });

  expect(result.videos).toEqual(mockVideos);
  expect(result.total).toBe(1);
});

// For rejected promises
it('should return unhealthy when service is down', async () => {
  (checkAllServices as jest.Mock).mockRejectedValue(new Error('Service error'));

  const result = await checkAllServices();

  expect(result.overall).toBe('unhealthy');
});
```

**Error Testing:**
```typescript
// Testing thrown errors
it('should throw error if video not found', async () => {
  prismaMock.video.findFirst.mockResolvedValue(null);

  await expect(deleteVideo('nonexistent', 'family-1')).rejects.toThrow('Video not found');
});

// Testing error states in responses
it('should return 503 on error', async () => {
  (checkAllServices as jest.Mock).mockRejectedValue(new Error('System error'));

  const response = await GET();
  const data = await response.json();

  expect(response.status).toBe(503);
  expect(data.overall).toBe('unhealthy');
  expect(data.error).toBeDefined();
});
```

**Mock Call Verification:**
```typescript
// Verify mocks were called with specific arguments
expect(prismaMock.video.update).toHaveBeenCalledWith({
  where: { id: 'video-1', familyId: 'family-1' },
  data: expect.objectContaining({ title: 'Updated Title' }),
});

// Verify call count
expect(prismaMock.video.findMany).toHaveBeenCalledTimes(1);

// Verify calls with deep matching
expect(prismaMock.video.findMany).toHaveBeenCalledWith(
  expect.objectContaining({
    where: expect.objectContaining({
      approvalStatus: 'APPROVED',
    }),
  })
);
```

**Coverage Gaps:**
- API routes (`/api/**`) - tested via integration tests instead
- Type-only files - naturally excluded
- Stub implementations - should have test coverage
- Error branches - ensure all error paths tested

---

*Testing analysis: 2026-01-22*
