/**
 * Test Setup Configuration
 * 
 * Initializes testing environment with Jest/Vitest
 */

// Mock environment variables
process.env.AUTH_SECRET = "test-secret-key-for-testing-only";
process.env.AUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.DIRECT_URL = "postgresql://test:test@localhost:5432/test_db";

// Mock Next.js modules
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT: ${url}`);
  }),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock server-only modules for client-side tests
jest.mock("server-only", () => ({}));

export {};
