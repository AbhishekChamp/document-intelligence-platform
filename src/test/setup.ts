import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock fetch for dictionary loading
globalThis.fetch = vi.fn() as unknown as typeof fetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL - handle both constructor and static methods
const createObjectURLMock = vi.fn(() => "blob:test");
const revokeObjectURLMock = vi.fn();

// @ts-expect-error - mocking URL
globalThis.URL = class URLMock {
  href: string;
  pathname: string;

  constructor(url: string, base?: string) {
    this.href = base ? `${base}/${url}` : url;
    this.pathname = url;
  }

  static createObjectURL = createObjectURLMock;
  static revokeObjectURL = revokeObjectURLMock;
};

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
  value: IntersectionObserverMock,
});
