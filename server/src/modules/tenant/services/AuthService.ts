import { TenantRepository } from "../respository";
import * as security from "../../../utils/security";
import { Tenant, NewTenant } from "../schema";
import { TenantRegisterInput, TenantLoginInput, TenantResponse } from "../zodSchema";

/**
 * AuthService handles tenant registration and authentication logic
 * Designed for scalability: stateless, dependency injection, clean separation of concerns
 */
export class AuthService {
    constructor(private readonly tenantRepository: TenantRepository) {}

    /**
     * Register a new tenant with hashed password
     * @param payload - Tenant registration data (name, email, password)
     * @returns Tenant response with JWT token
     */
    async registerTenant(payload: TenantRegisterInput): Promise<{ tenant: TenantResponse; token: string }> {
        // Check if tenant already exists
        const existingTenant = await this.tenantRepository.getTenantByEmail(payload.email);
        if (existingTenant) {
            throw new Error("Tenant already exists with this email");
        }

        // Hash password with salt
        const { hashedPassword, salt } = security.hashPassword(payload.password);

        // Create tenant with hashed credentials
        const newTenant: Partial<NewTenant> = {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            salt: salt,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const tenant = await this.tenantRepository.createTenant(newTenant as NewTenant);

        // Generate JWT token for immediate authentication
        const token = security.generateJWTToken({
            id: tenant.id,
            email: tenant.email,
        });

        // Return sanitized tenant response (no password/salt)
        return {
            tenant: this.sanitizeTenantResponse(tenant),
            token,
        };
    }

    /**
     * Authenticate tenant with email and password
     * @param payload - Login credentials (email, password)
     * @returns Tenant response with JWT token
     */
    async loginTenant(payload: TenantLoginInput): Promise<{ tenant: TenantResponse; token: string }> {
        // Find tenant by email
        const tenant = await this.tenantRepository.getTenantByEmail(payload.email);
        
        if (!tenant) {
            throw new Error("Invalid email or password");
        }

        // Check if tenant is active
        if (tenant.status !== "active") {
            throw new Error("Tenant account is not active");
        }

        // Verify password
        const isPasswordValid = security.comparePassword(payload.password, tenant.password, tenant.salt);

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        // Generate JWT token
        const token = security.generateJWTToken({
            id: tenant.id,
            email: tenant.email,
        });

        // Return sanitized tenant response
        return {
            tenant: this.sanitizeTenantResponse(tenant),
            token,
        };
    }

    /**
     * Sanitize tenant response to remove sensitive fields (password, salt)
     * @param tenant - Raw tenant from database
     * @returns Public tenant response
     */
    private sanitizeTenantResponse(tenant: Tenant): TenantResponse {
        return {
            id: tenant.id,
            name: tenant.name,
            email: tenant.email,
            status: tenant.status,
            created_at: tenant.created_at,
            updated_at: tenant.updated_at,
        };
    }
}
