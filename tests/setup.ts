import { vi } from 'vitest';

// Mock Chrome APIs
Object.defineProperty(window, 'chrome', {
  value: {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn(),
      create: vi.fn(),
    },
    bookmarks: {
      getTree: vi.fn(),
    },
  },
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    search: '',
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Mock console methods for testing
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};
