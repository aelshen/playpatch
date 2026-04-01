# Testing Guide for SafeStream Kids
**Comprehensive guide to writing and running tests**

---

## Table of Contents
1. [Overview](#overview)
2. [Testing Infrastructure](#testing-infrastructure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Testing Patterns](#testing-patterns)
6. [Best Practices](#best-practices)
7. [Coverage Goals](#coverage-goals)
8. [Troubleshooting](#troubleshooting)

---

## Overview

SafeStream Kids uses **Jest** as the testing framework with React Testing Library for component tests. Our testing strategy focuses on:

- **Unit Tests**: Testing individual functions and modules in isolation
- **Integration Tests**: Testing API routes and database interactions
- **Component Tests**: Testing React components (future)
- **E2E Tests**: Testing full user flows with Playwright (future)

### Current Test Coverage

| Area | Files | Coverage | Status |
|------|-------|----------|--------|
| Database Queries | 3 | 90%+ | ✅ Complete |
| Utility Functions | 5 | 90%+ | ✅ Complete |
| Health Checks | 1 | 95%+ | ✅ Complete |
| Constants | 1 | 100% | ✅ Complete |
| API Routes | 1 | 80%+ | ✅ Complete |
| Components | 0 | 0% | 🚧 Pending |
| Workers | 0 | 0% | 🚧 Pending |

**Overall Coverage Goal: 70%+**

---

## Testing Infrastructure

### Dependencies Installed

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-mock-extended": "^3.0.5",
    "ts-jest": "^29.1.1"
  }
}
```

### Configuration Files

**jest.config.js** - Main Jest configuration
- Uses Next.js preset for proper module resolution
- Configures path aliases (`@/...`)
- Sets coverage thresholds (70% minimum)
- Excludes unnecessary files from coverage

**jest.setup.js** - Test setup and global mocks
- Loads @testing-library/jest-dom matchers
- Mocks Next.js router
- Mocks logger to reduce console noise
- Sets environment variables for tests

---

## Running Tests

### Available Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (no watch, with coverage)
pnpm test:ci
```

### Running Specific Tests

```bash
# Run tests in a specific file
pnpm test videos.test.ts

# Run tests matching a pattern
pnpm test --testNamePattern="should create video"

# Run tests in a specific directory
pnpm test __tests__/lib/db

# Run only changed tests (useful during development)
pnpm test --onlyChanged
```

### Debugging Tests

```bash
# Run tests with verbose output
pnpm test --verbose

# Run a single test file with debugging
node --inspect-brk node_modules/.bin/jest --runInBand videos.test.ts
```

Then open Chrome DevTools and navigate to `chrome://inspect`

---

## Writing Tests

### Test File Structure

```
src/
├── __tests__/              # Test files mirror src structure
│   ├── lib/
│   │   ├── db/
│   │   │   └── queries/
│   │   │       └── videos.test.ts
│   │   ├── utils/
│   │   │   └── age-rating.test.ts
│   │   └── health/
│   │       └── checks.test.ts
│   └── integration/
│       └── api/
│           └── health.test.ts
└── lib/
    ├── db/
    │   └── queries/
    │       └── videos.ts      # Implementation
    └── __mocks__/             # Manual mocks
        └── prisma.ts
```

### Basic Test Template

```typescript
/**
 * Unit tests for [module name]
 * [Brief description of what's being tested]
 */

import { functionToTest } from '@/lib/module';

describe('Module Name', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('functionToTest', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test input';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected output');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should throw error for invalid input', () => {
      expect(() => functionToTest(null)).toThrow();
    });
  });
});
```

---

## Testing Patterns

### 1. Testing Database Queries

**Pattern: Mock Prisma Client**

```typescript
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getVideosByFamily } from '@/lib/db/queries/videos';

jest.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));

describe('getVideosByFamily', () => {
  it('should return videos with pagination', async () => {
    // Arrange
    const mockVideos = [{ id: '1', title: 'Test' }];
    prismaMock.video.findMany.mockResolvedValue(mockVideos);
    prismaMock.video.count.mockResolvedValue(1);

    // Act
    const result = await getVideosByFamily({
      familyId: 'family-1',
      limit: 20,
    });

    // Assert
    expect(result.videos).toEqual(mockVideos);
    expect(result.total).toBe(1);
    expect(prismaMock.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'family-1' },
        take: 20,
      })
    );
  });
});
```

### 2. Testing Utility Functions

**Pattern: Pure Function Testing**

```typescript
import { formatDuration } from '@/lib/utils/shared';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [30, '0:30'],
    [65, '1:05'],
    [3665, '1:01:05'],
  ])('should format %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
```

### 3. Testing Health Checks

**Pattern: Mock External Services**

```typescript
jest.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

import { checkDatabase } from '@/lib/health/checks';
import { prisma } from '@/lib/db/client';

describe('checkDatabase', () => {
  it('should return healthy when database is accessible', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

    const result = await checkDatabase();

    expect(result.healthy).toBe(true);
    expect(result.latency).toBeGreaterThan(0);
  });
});
```

### 4. Testing API Routes

**Pattern: Integration Test with Mocked Dependencies**

```typescript
import { GET } from '@/app/api/health/route';

jest.mock('@/lib/health/checks', () => ({
  checkAllServices: jest.fn(),
}));

import { checkAllServices } from '@/lib/health/checks';

describe('GET /api/health', () => {
  it('should return 200 when healthy', async () => {
    (checkAllServices as jest.Mock).mockResolvedValue({
      overall: 'healthy',
      services: { database: { healthy: true } },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall).toBe('healthy');
  });
});
```

### 5. Testing Components (Future)

**Pattern: React Testing Library**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoCard } from '@/components/video-card';

describe('VideoCard', () => {
  it('should render video title', () => {
    render(<VideoCard title="Test Video" />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<VideoCard title="Test" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Best Practices

### 1. Test Organization

✅ **DO:**
- Group related tests with `describe` blocks
- Use clear, descriptive test names: "should [expected behavior]"
- Follow AAA pattern: Arrange, Act, Assert
- Test one thing per test case

❌ **DON'T:**
- Test multiple unrelated behaviors in one test
- Use unclear test names like "test 1"
- Have side effects between tests
- Test implementation details

### 2. Mocking

✅ **DO:**
- Mock external dependencies (database, APIs, file system)
- Use jest-mock-extended for type-safe mocks
- Reset mocks between tests with `jest.clearAllMocks()`
- Mock at the module level when testing integrations

❌ **DON'T:**
- Mock the code you're testing
- Over-mock (makes tests brittle)
- Forget to restore mocks after tests
- Mock pure utility functions

### 3. Test Data

✅ **DO:**
- Use realistic test data
- Create test data factories for reusability
- Use constants for common test values
- Document why specific test data is used

❌ **DON'T:**
- Use production data in tests
- Hardcode magic numbers without explanation
- Reuse test data across unrelated tests
- Mutate shared test data

### 4. Assertions

✅ **DO:**
- Be specific with assertions
- Test both success and error cases
- Test edge cases and boundary conditions
- Use appropriate matchers (toBe, toEqual, toContain, etc.)

❌ **DON'T:**
- Use vague assertions like `expect(result).toBeTruthy()`
- Test only the happy path
- Have tests with no assertions
- Use complex logic in assertions

### 5. Test Independence

✅ **DO:**
- Make tests isolated and independent
- Clean up after each test
- Use `beforeEach` for setup
- Use `afterEach` for cleanup

❌ **DON'T:**
- Depend on test execution order
- Share state between tests
- Leave side effects
- Use global variables

---

## Coverage Goals

### Minimum Coverage Requirements

Set in `jest.config.js`:

```javascript
coverageThresholds: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### Priority Areas for 100% Coverage

1. **Security-critical functions**
   - Authentication logic
   - Authorization checks
   - Input validation

2. **Data integrity functions**
   - Database queries with data manipulation
   - File operations
   - State management

3. **Business logic**
   - Age rating calculations
   - Content filtering
   - Time limit enforcement

### Acceptable Lower Coverage

- Generated code (Prisma client)
- Type definitions
- Configuration files
- Pure UI components (visual testing)

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@/...'"

**Problem:** Path aliases not resolving

**Solution:**
```javascript
// jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

#### 2. "ReferenceError: TextEncoder is not defined"

**Problem:** Missing Node.js globals in jsdom

**Solution:**
```javascript
// jest.setup.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
```

#### 3. "Database connection failed in tests"

**Problem:** Prisma client trying to connect to real database

**Solution:** Ensure Prisma is mocked:
```typescript
jest.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));
```

#### 4. "Timeout error in async tests"

**Problem:** Test taking too long

**Solution:**
```typescript
it('should handle async operation', async () => {
  // Your test
}, 10000); // 10 second timeout
```

#### 5. "Mock not being called"

**Problem:** Mock defined after module import

**Solution:** Define mocks before imports:
```typescript
// ✅ Correct order
jest.mock('@/lib/module');
import { function } from '@/lib/module';

// ❌ Wrong order
import { function } from '@/lib/module';
jest.mock('@/lib/module');
```

---

## Examples Reference

### Test Data Factories

```typescript
// __tests__/factories/video.ts
export const createMockVideo = (overrides = {}) => ({
  id: 'video-1',
  title: 'Test Video',
  familyId: 'family-1',
  status: 'READY',
  approvalStatus: 'APPROVED',
  ageRating: 'AGE_7_PLUS',
  duration: 300,
  ...overrides,
});
```

### Async Testing

```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();
  await expect(promise).resolves.toBe('success');
});

it('should handle async errors', async () => {
  const promise = asyncFunction();
  await expect(promise).rejects.toThrow('Error message');
});
```

### Snapshot Testing

```typescript
it('should match snapshot', () => {
  const data = generateComplexData();
  expect(data).toMatchSnapshot();
});
```

### Timer Mocking

```typescript
jest.useFakeTimers();

it('should handle setTimeout', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);

  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - run: pnpm install
      - run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [jest-mock-extended](https://github.com/marchaos/jest-mock-extended)

---

## Checklist for New Tests

Before submitting a PR with new tests:

- [ ] Tests follow naming convention
- [ ] All tests pass locally
- [ ] Coverage thresholds met
- [ ] Mocks properly reset between tests
- [ ] Edge cases covered
- [ ] Error cases tested
- [ ] Tests are independent
- [ ] Documentation updated if needed
- [ ] No console errors or warnings
- [ ] Fast execution time (<1s per test)

---

**Last Updated:** January 10, 2026
**Maintained By:** SafeStream Development Team
