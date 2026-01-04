// Jest setup file
require('dotenv').config({ path: '.env' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods in tests if needed
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(30000);