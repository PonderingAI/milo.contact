// jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js environment
global.Request = class MockRequest {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }
};

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }
};

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  }))
}));
