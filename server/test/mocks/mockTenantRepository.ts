/**
 * Mock implementation of TenantRepository for testing
 * Implements ITenantRepository interface without requiring database connection
 * Uses in-memory storage to simulate database operations
 */

import { ITenantRepository } from '../../src/modules/tenant/respository';
import { Tenant, NewTenant } from '../../src/modules/tenant/schema';

export class MockTenantRepository implements ITenantRepository {
  private tenants: Map<number, Tenant> = new Map();
  private nextId = 1;

  //create new tenant
  async createTenant(payload: NewTenant): Promise<Tenant> {
    const tenant: Tenant = {
      id: this.nextId++,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      salt: payload.salt,
      status: payload.status || 'active',
      created_at: payload.created_at || new Date().toISOString(),
      updated_at: payload.updated_at || new Date().toISOString(),
    };

    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  //get tenant by email
  async getTenantByEmail(email: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.email === email) {
        return tenant;
      }
    }
    return null;
  }

  // get tenant by id
  async getTenantById(id: number): Promise<Tenant | null> {
    return this.tenants.get(id) || null;
  }

  // update tenant
  async updateTenant(id: number, payload: Partial<NewTenant>): Promise<Tenant> {
    const existingTenant = this.tenants.get(id);
    if (!existingTenant) {
      throw new Error(`Tenant with id ${id} not found`);
    }

    const updatedTenant: Tenant = {
      ...existingTenant,
      ...payload,
      id: existingTenant.id, // Ensure id doesn't change
      updated_at: new Date().toISOString(),
    };

    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  // clear all tenants (helper for testing)
  clear(): void {
    this.tenants.clear();
    this.nextId = 1;
  }

  // get all tenants (helper for testing)
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  // Seed with initial data (helper for testing)
  seed(tenants: Tenant[]): void {
    tenants.forEach(tenant => {
      this.tenants.set(tenant.id, tenant);
      if (tenant.id >= this.nextId) {
        this.nextId = tenant.id + 1;
      }
    });
  }
}

// Factory function to create a fresh mock repository instance
export const createMockTenantRepository = (): MockTenantRepository => {
  return new MockTenantRepository();
};
