/**
 * Unit tests for Tenant Repository
 * Tests CRUD operations with mock implementation
 */
import {describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import { MockTenantRepository } from '../../mocks/mockTenantRepository';
import { NewTenant, Tenant } from '../../../src/modules/tenant/schema';
import { randomEmail, generateStrongPassword } from '../../helpers/testHelpers';
import { hashPasword } from '../../../src/utils/security';

describe('TenantRepository', () => {
  let repository: MockTenantRepository;

  beforeEach(() => {
    repository = new MockTenantRepository();
  });

  afterEach(() => {
    repository.clear();
  });

  describe('createTenant', () => {
    it('should create a new tenant with valid data', async () => {
      // Arrange
      const email = randomEmail();
      const password = generateStrongPassword();
      const { hashedPassword, salt } = hashPasword(password);
      
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email,
        password: hashedPassword,
        salt: salt,
        status: 'active',
      };

      // Act
      const created = await repository.createTenant(newTenant);

      // Assert
      expect(created).toBeDefined();
      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe(newTenant.name);
      expect(created.email).toBe(newTenant.email);
      expect(created.password).toBe(hashedPassword);
      expect(created.status).toBe('active');
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should auto-generate timestamps if not provided', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };

      // Act
      const created = await repository.createTenant(newTenant);

      // Assert
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
      expect(new Date(created.created_at).getTime()).toBeGreaterThan(0);
    });

    it('should use default status "active" if not provided', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };

      // Act
      const created = await repository.createTenant(newTenant);

      // Assert
      expect(created.status).toBe('active');
    });

    it('should respect provided status', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
        status: 'inactive',
      };

      // Act
      const created = await repository.createTenant(newTenant);

      // Assert
      expect(created.status).toBe('inactive');
    });

    it('should assign unique IDs to multiple tenants', async () => {
      // Arrange
      const tenant1: NewTenant = {
        name: 'Tenant 1',
        email: randomEmail(),
        password: 'password1',
        salt: 'salt1',
      };
      const tenant2: NewTenant = {
        name: 'Tenant 2',
        email: randomEmail(),
        password: 'password2',
        salt: 'salt2',
      };

      // Act
      const created1 = await repository.createTenant(tenant1);
      const created2 = await repository.createTenant(tenant2);

      // Assert
      expect(created1.id).not.toBe(created2.id);
      expect(created2.id).toBe(created1.id + 1);
    });
  });

  describe('getTenantByEmail', () => {
    it('should return tenant when email exists', async () => {
      // Arrange
      const email = randomEmail();
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email,
        password: 'hashed-password',
        salt: 'test-salt',
      };
      const created = await repository.createTenant(newTenant);

      // Act
      const found = await repository.getTenantByEmail(email);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(email);
      expect(found?.name).toBe('Test Tenant');
    });

    it('should return null when email does not exist', async () => {
      // Act
      const found = await repository.getTenantByEmail('nonexistent@test.com');

      // Assert
      expect(found).toBeNull();
    });

    it('should perform case-sensitive email matching', async () => {
      // Arrange
      const email = 'test@example.com';
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email,
        password: 'hashed-password',
        salt: 'test-salt',
      };
      await repository.createTenant(newTenant);

      // Act
      const found = await repository.getTenantByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(found).toBeNull();
    });

    it('should return the correct tenant when multiple tenants exist', async () => {
      // Arrange
      const email1 = randomEmail();
      const email2 = randomEmail();
      
      await repository.createTenant({
        name: 'Tenant 1',
        email: email1,
        password: 'password1',
        salt: 'salt1',
      });
      
      const tenant2 = await repository.createTenant({
        name: 'Tenant 2',
        email: email2,
        password: 'password2',
        salt: 'salt2',
      });

      // Act
      const found = await repository.getTenantByEmail(email2);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe(tenant2.id);
      expect(found?.name).toBe('Tenant 2');
    });
  });

  describe('getTenantById', () => {
    it('should return tenant when ID exists', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };
      const created = await repository.createTenant(newTenant);

      // Act
      const found = await repository.getTenantById(created.id);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Tenant');
      expect(found?.email).toBe(created.email);
    });

    it('should return null when ID does not exist', async () => {
      // Act
      const found = await repository.getTenantById(9999);

      // Assert
      expect(found).toBeNull();
    });

    it('should return the correct tenant when multiple tenants exist', async () => {
      // Arrange
      await repository.createTenant({
        name: 'Tenant 1',
        email: randomEmail(),
        password: 'password1',
        salt: 'salt1',
      });
      
      const tenant2 = await repository.createTenant({
        name: 'Tenant 2',
        email: randomEmail(),
        password: 'password2',
        salt: 'salt2',
      });

      // Act
      const found = await repository.getTenantById(tenant2.id);

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe(tenant2.id);
      expect(found?.name).toBe('Tenant 2');
    });
  });

  describe('updateTenant', () => {
    it('should update tenant name', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Original Name',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };
      const created = await repository.createTenant(newTenant);

      // Act
      const updated = await repository.updateTenant(created.id, {
        name: 'Updated Name',
      });

      // Assert
      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe(created.email); // Unchanged
    });

    it('should update tenant status', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
        status: 'active',
      };
      const created = await repository.createTenant(newTenant);

      // Act
      const updated = await repository.updateTenant(created.id, {
        status: 'inactive',
      });

      // Assert
      expect(updated.status).toBe('inactive');
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Original Name',
        email: randomEmail(),
        password: 'old-password',
        salt: 'old-salt',
      };
      const created = await repository.createTenant(newTenant);

      // Act
      const updated = await repository.updateTenant(created.id, {
        name: 'New Name',
        password: 'new-password',
        salt: 'new-salt',
      });

      // Assert
      expect(updated.name).toBe('New Name');
      expect(updated.password).toBe('new-password');
      expect(updated.salt).toBe('new-salt');
      expect(updated.email).toBe(created.email); // Unchanged
    });

    it('should update updated_at timestamp', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };
      const created = await repository.createTenant(newTenant);
      const originalUpdatedAt = created.updated_at;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      const updated = await repository.updateTenant(created.id, {
        name: 'Updated Name',
      });

      // Assert
      expect(updated.updated_at).not.toBe(originalUpdatedAt);
      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should not change the tenant ID', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };
      const created = await repository.createTenant(newTenant);
      const originalId = created.id;

      // Act
      const updated = await repository.updateTenant(created.id, {
        name: 'Updated Name',
      });

      // Assert
      expect(updated.id).toBe(originalId);
    });

    it('should throw error when updating non-existent tenant', async () => {
      // Act & Assert
      await expect(
        repository.updateTenant(9999, { name: 'Updated Name' })
      ).rejects.toThrow('Tenant with id 9999 not found');
    });

    it('should preserve created_at timestamp', async () => {
      // Arrange
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        email: randomEmail(),
        password: 'hashed-password',
        salt: 'test-salt',
      };
      const created = await repository.createTenant(newTenant);
      const originalCreatedAt = created.created_at;

      // Act
      const updated = await repository.updateTenant(created.id, {
        name: 'Updated Name',
      });

      // Assert
      expect(updated.created_at).toBe(originalCreatedAt);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle create -> retrieve -> update -> retrieve flow', async () => {
      // Create
      const email = randomEmail();
      const created = await repository.createTenant({
        name: 'Original Tenant',
        email,
        password: 'hashed-password',
        salt: 'test-salt',
      });

      // Retrieve by email
      const foundByEmail = await repository.getTenantByEmail(email);
      expect(foundByEmail?.id).toBe(created.id);

      // Retrieve by ID
      const foundById = await repository.getTenantById(created.id);
      expect(foundById?.name).toBe('Original Tenant');

      // Update
      const updated = await repository.updateTenant(created.id, {
        name: 'Updated Tenant',
        status: 'inactive',
      });
      expect(updated.name).toBe('Updated Tenant');
      expect(updated.status).toBe('inactive');

      // Retrieve again to verify update persisted
      const foundAfterUpdate = await repository.getTenantById(created.id);
      expect(foundAfterUpdate?.name).toBe('Updated Tenant');
      expect(foundAfterUpdate?.status).toBe('inactive');
    });

    it('should maintain data consistency across multiple operations', async () => {
      // Create multiple tenants
      const tenant1 = await repository.createTenant({
        name: 'Tenant 1',
        email: 'tenant1@test.com',
        password: 'password1',
        salt: 'salt1',
      });

      const tenant2 = await repository.createTenant({
        name: 'Tenant 2',
        email: 'tenant2@test.com',
        password: 'password2',
        salt: 'salt2',
      });

      // Update first tenant
      await repository.updateTenant(tenant1.id, {
        name: 'Updated Tenant 1',
      });

      // Verify second tenant is unchanged
      const foundTenant2 = await repository.getTenantById(tenant2.id);
      expect(foundTenant2?.name).toBe('Tenant 2');

      // Verify first tenant is updated
      const foundTenant1 = await repository.getTenantById(tenant1.id);
      expect(foundTenant1?.name).toBe('Updated Tenant 1');
    });
  });

  describe('Mock utility methods', () => {
    it('should clear all tenants', async () => {
      // Arrange
      await repository.createTenant({
        name: 'Tenant 1',
        email: randomEmail(),
        password: 'password1',
        salt: 'salt1',
      });

      await repository.createTenant({
        name: 'Tenant 2',
        email: randomEmail(),
        password: 'password2',
        salt: 'salt2',
      });

      // Act
      repository.clear();

      // Assert
      const allTenants = repository.getAllTenants();
      expect(allTenants).toHaveLength(0);
    });

    it('should reset ID counter after clear', async () => {
      // Arrange
      const tenant1 = await repository.createTenant({
        name: 'Tenant 1',
        email: randomEmail(),
        password: 'password1',
        salt: 'salt1',
      });
      expect(tenant1.id).toBe(1);

      // Act
      repository.clear();
      const tenant2 = await repository.createTenant({
        name: 'Tenant 2',
        email: randomEmail(),
        password: 'password2',
        salt: 'salt2',
      });

      // Assert
      expect(tenant2.id).toBe(1); // ID should restart from 1
    });

    it('should seed with initial data', async () => {
      // Arrange
      const seedData: Tenant[] = [
        {
          id: 10,
          name: 'Seeded Tenant 1',
          email: 'seed1@test.com',
          password: 'password1',
          salt: 'salt1',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 20,
          name: 'Seeded Tenant 2',
          email: 'seed2@test.com',
          password: 'password2',
          salt: 'salt2',
          status: 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Act
      repository.seed(seedData);

      // Assert
      const found1 = await repository.getTenantById(10);
      const found2 = await repository.getTenantById(20);
      expect(found1?.name).toBe('Seeded Tenant 1');
      expect(found2?.name).toBe('Seeded Tenant 2');
    });

    it('should adjust ID counter based on seeded data', async () => {
      // Arrange
      const seedData: Tenant[] = [
        {
          id: 100,
          name: 'Seeded Tenant',
          email: 'seed@test.com',
          password: 'password',
          salt: 'salt',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Act
      repository.seed(seedData);
      const newTenant = await repository.createTenant({
        name: 'New Tenant',
        email: randomEmail(),
        password: 'password',
        salt: 'salt',
      });

      // Assert
      expect(newTenant.id).toBe(101); // Should be next after highest seeded ID
    });

    it('should return all tenants', async () => {
      // Arrange
      await repository.createTenant({
        name: 'Tenant 1',
        email: randomEmail(),
        password: 'password1',
        salt: 'salt1',
      });

      await repository.createTenant({
        name: 'Tenant 2',
        email: randomEmail(),
        password: 'password2',
        salt: 'salt2',
      });

      // Act
      const allTenants = repository.getAllTenants();

      // Assert
      expect(allTenants)?.toHaveLength(2);
      expect(allTenants[0]?.name).toBe('Tenant 1');
      expect(allTenants[1]?.name).toBe('Tenant 2');
    });
  });
});
