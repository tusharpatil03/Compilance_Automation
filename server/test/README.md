# Testing Guide

This directory contains the test suite for the Compilance Automation server project.

## Directory Structure

```
test/
├── unit/                    # Unit tests
│   ├── security.test.ts     # Security utilities tests
│   └── repositories/        # Repository tests
│       └── tenantRepository.test.ts
├── helpers/                 # Test helper functions
│   └── testHelpers.ts
├── mocks/                   # Mock implementations
│   └── mockTenantRepository.ts
├── fixtures/                # Test data fixtures
│   └── testData.ts
└── setup.ts                 # Jest setup file
```

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with coverage
```bash
pnpm test:coverage
```

### Run specific test file
```bash
pnpm test security.test.ts
```

### Run tests matching a pattern
```bash
pnpm test --testNamePattern="should create"
```

## Writing Tests

### Test Structure

```typescript
describe('Feature/Module Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize mocks, reset state
  });

  // Cleanup after each test
  afterEach(() => {
    // Clear mocks, restore state
  });

  describe('Specific functionality', () => {
    it('should do something specific', async () => {
      // Arrange - Set up test data
      const input = 'test';

      // Act - Execute the function
      const result = await functionUnderTest(input);

      // Assert - Verify the result
      expect(result).toBeDefined();
      expect(result.value).toBe(expected);
    });
  });
});
```

### Using Test Helpers

The `testHelpers.ts` file provides utility functions for common testing tasks:

```typescript
import { 
  randomString, 
  randomEmail, 
  generateStrongPassword,
  createTestTenant,
  withEnv 
} from '../helpers/testHelpers';

// Generate random test data
const email = randomEmail();
const password = generateStrongPassword();

// Create test tenant
const tenant = createTestTenant({ name: 'Custom Name' });

// Test with environment variables
await withEnvAsync({ NODE_ENV: 'test' }, async () => {
  // Code that needs specific env vars
});
```

### Using Test Fixtures

The `testData.ts` file contains pre-defined test data:

```typescript
import { 
  validPasswords, 
  invalidPasswords,
  sampleTenants,
  errorMessages 
} from '../fixtures/testData';

// Use sample data in tests
const password = validPasswords[0];
const tenant = sampleTenants[0];
```

## Mocking Strategies

### Repository Mocking

We use mock implementations that implement the same interfaces as production code. This provides:

1. **Type Safety**: TypeScript ensures mocks match interfaces
2. **Simplicity**: No need to mock complex Drizzle chaining
3. **Control**: Easy to simulate different scenarios

Example:

```typescript
import { MockTenantRepository } from '../../mocks/mockTenantRepository';

describe('Service that uses repository', () => {
  let repository: MockTenantRepository;

  beforeEach(() => {
    repository = new MockTenantRepository();
  });

  afterEach(() => {
    repository.clear(); // Reset state
  });

  it('should create tenant', async () => {
    const tenant = await repository.createTenant({
      name: 'Test',
      email: 'test@example.com',
      password: 'hashed',
      salt: 'salt',
    });

    expect(tenant.id).toBeDefined();
  });
});
```

### Mock Repository Methods

The `MockTenantRepository` provides additional test utilities:

- `clear()` - Remove all data and reset ID counter
- `seed(tenants)` - Populate with initial data
- `getAllTenants()` - Get all stored tenants

## Testing Best Practices

### 1. Test Isolation
Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
  repository.clear(); // Start fresh
});
```

### 2. Descriptive Test Names
Use clear, descriptive names that explain what is being tested:

```typescript
it('should throw error when updating non-existent tenant', async () => {
  // ...
});
```

### 3. Arrange-Act-Assert Pattern
Structure tests with clear sections:

```typescript
it('should update tenant name', async () => {
  // Arrange
  const tenant = await repository.createTenant(data);
  
  // Act
  const updated = await repository.updateTenant(tenant.id, { name: 'New Name' });
  
  // Assert
  expect(updated.name).toBe('New Name');
});
```

### 4. Test Edge Cases
Don't just test the happy path:

```typescript
describe('getTenantByEmail', () => {
  it('should return tenant when email exists', async () => { /* ... */ });
  
  it('should return null when email does not exist', async () => { /* ... */ });
  
  it('should perform case-sensitive matching', async () => { /* ... */ });
});
```

### 5. Async/Await
Use async/await for cleaner asynchronous tests:

```typescript
it('should create tenant', async () => {
  const result = await repository.createTenant(data);
  expect(result).toBeDefined();
});
```

## Coverage Requirements

The project has the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

These thresholds are enforced in `jest.config.js`. Tests will fail if coverage drops below these levels.

### Viewing Coverage Report

After running `pnpm test:coverage`, view the detailed report:

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html
```

## Testing Utilities

### Security Utils Tests
Located in `test/unit/security.test.ts`, covers:
- Password hashing with salt generation
- Password comparison
- API key generation (uniqueness, URL-safe)
- API key hashing (bcrypt format)
- JWT token generation and verification

### Repository Tests
Located in `test/unit/repositories/`, covers:
- CRUD operations (Create, Read, Update)
- Edge cases (not found, duplicates)
- Data consistency across operations
- Timestamp management
- Error handling

## Common Issues

### Issue: Tests fail with module not found
**Solution**: Ensure `tsconfig.json` includes test files and paths are correct.

### Issue: Mock doesn't implement interface
**Solution**: Verify mock class implements all required interface methods with correct signatures.

### Issue: Async tests timeout
**Solution**: Ensure all async operations use `await` and promises resolve/reject properly.

### Issue: Coverage below threshold
**Solution**: Add more test cases to cover untested branches and lines.

## Adding New Tests

When adding new modules, follow this pattern:

1. **Create Mock** (if needed): `test/mocks/mockYourModule.ts`
2. **Write Tests**: `test/unit/yourModule.test.ts`
3. **Add Fixtures** (if needed): Add to `test/fixtures/testData.ts`
4. **Run Tests**: `pnpm test yourModule.test.ts`
5. **Check Coverage**: `pnpm test:coverage`

## Continuous Integration

Tests should be run in CI/CD pipeline before deployment:

```yaml
# Example CI configuration
test:
  script:
    - pnpm install
    - pnpm test:coverage
  coverage: '/^All files\s+\|\s+(\d+\.?\d*)/'
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
