# Testing Guide

## Overview

WorkOS uses a multi-layered testing strategy:
- **Unit tests** - Individual functions and components
- **Integration tests** - API routes and database operations
- **E2E tests** - Full user workflows
- **Load tests** - Performance and scalability

## Test Setup

### Install Dependencies

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D jest jest-environment-jsdom @types/jest
pnpm add -D @playwright/test
pnpm add -D k6  # For load testing
```

### Configuration

**Jest Config** (`jest.config.js`):

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

**Jest Setup** (`jest.setup.js`):

```javascript
import '@testing-library/jest-dom'
```

**Playwright Config** (`playwright.config.ts`):

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Unit Tests

### Testing Utilities

**Example: `lib/utils.test.ts`**

```typescript
import { formatCurrency, formatPhone } from './utils';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(10000, 'USD')).toBe('$100.00');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
});

describe('formatPhone', () => {
  it('formats E.164 to readable', () => {
    expect(formatPhone('+15551234567')).toBe('(555) 123-4567');
  });
});
```

### Testing React Components

**Example: `components/PersonCard.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react';
import { PersonCard } from './PersonCard';

describe('PersonCard', () => {
  it('renders person name', () => {
    const person = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    render(<PersonCard person={person} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Testing API Routes

**Example: `app/api/people/route.test.ts`**

```typescript
import { POST } from './route';
import { createMocks } from 'node-mocks-http';

describe('/api/people', () => {
  it('creates a person', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        orgId: 'org-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }
    });

    await POST(req as any);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.firstName).toBe('John');
  });
});
```

## Integration Tests

### Database Tests

**Setup test database:**

```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js';

export const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!
);

export async function cleanupTestData(orgId: string) {
  await testSupabase.from('people').delete().eq('org_id', orgId);
  await testSupabase.from('companies').delete().eq('org_id', orgId);
  // ... cleanup other tables
}
```

**Example integration test:**

```typescript
// tests/integration/people.test.ts
import { testSupabase, cleanupTestData } from '../setup';

describe('People Integration', () => {
  const testOrgId = 'test-org-123';

  afterEach(async () => {
    await cleanupTestData(testOrgId);
  });

  it('creates and retrieves person', async () => {
    // Create person
    const { data: person } = await testSupabase
      .from('people')
      .insert({
        org_id: testOrgId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      })
      .select()
      .single();

    expect(person).toBeDefined();
    expect(person.first_name).toBe('John');

    // Retrieve person
    const { data: retrieved } = await testSupabase
      .from('people')
      .select()
      .eq('id', person.id)
      .single();

    expect(retrieved.email).toBe('john@example.com');
  });
});
```

### RLS Policy Tests

```typescript
// tests/integration/rls.test.ts
describe('Row Level Security', () => {
  it('prevents cross-org data access', async () => {
    const org1 = await createTestOrg('Org 1');
    const org2 = await createTestOrg('Org 2');
    
    const person1 = await createTestPerson(org1.id, 'John');
    
    // Try to access from org2
    const { data, error } = await testSupabase
      .from('people')
      .select()
      .eq('id', person1.id)
      .eq('org_id', org2.id)
      .single();

    expect(data).toBeNull();
    expect(error).toBeDefined();
  });
});
```

## E2E Tests

### Playwright Tests

**Example: `e2e/crm.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('CRM', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('creates a person and sends email', async ({ page }) => {
    // Navigate to people
    await page.click('text=People');
    await page.waitForURL('/people');

    // Create person
    await page.click('text=New Person');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.click('button:has-text("Create")');

    // Verify person created
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Send email
    await page.click('text=John Doe');
    await page.click('button:has-text("Send Email")');
    await page.fill('[name="subject"]', 'Test Email');
    await page.fill('[name="body"]', 'This is a test');
    await page.click('button:has-text("Send")');

    // Verify email in timeline
    await expect(page.locator('text=Test Email')).toBeVisible();
  });

  test('moves deal between stages', async ({ page }) => {
    // Create deal
    // Drag to new stage
    // Verify stage updated
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test
pnpm test:e2e crm

# Run in UI mode
pnpm test:e2e --ui

# Run in headed mode
pnpm test:e2e --headed
```

## Load Testing

### k6 Setup

**Example: `load-tests/api.js`**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 50 },   // Stay at 50
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% under 400ms
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

const API_KEY = __ENV.API_KEY;
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  // List people
  const listRes = http.get(`${BASE_URL}/api/people?orgId=test-org`, {
    headers,
  });
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list duration < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(1);
}
```

### Running Load Tests

```bash
# Run load test
k6 run load-tests/api.js

# With environment variables
API_KEY=xxx BASE_URL=https://api.workos.com k6 run load-tests/api.js
```

## Test Coverage

### Generate Coverage Report

```bash
pnpm test --coverage
```

### Coverage Goals

- **Unit tests:** >80% coverage
- **Integration tests:** Critical paths covered
- **E2E tests:** Main user flows covered

## CI/CD Integration

### GitHub Actions

**`.github/workflows/test.yml`:**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
```

## Best Practices

1. **Write tests before fixing bugs** (TDD)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests isolated and independent**
5. **Mock external services** (Gmail, Twilio)
6. **Clean up test data** after each test
7. **Test error cases** as well as success
8. **Keep tests fast** (< 1s for unit tests)

## Common Patterns

### Mocking Supabase

```typescript
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));
```

### Mocking Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));
```

## Resources

- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [k6](https://k6.io/)
- [Jest](https://jestjs.io/)

