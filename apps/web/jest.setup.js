// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.STORAGE_TYPE = 'local';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock logger to avoid console noise in tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test utilities
global.mockPrismaCreate = (data) => Promise.resolve({ id: 'test-id', ...data });
global.mockPrismaFindUnique = (data) => Promise.resolve(data);
global.mockPrismaFindMany = (data) => Promise.resolve(data || []);
global.mockPrismaUpdate = (data) => Promise.resolve(data);
global.mockPrismaDelete = () => Promise.resolve({ id: 'deleted-id' });
