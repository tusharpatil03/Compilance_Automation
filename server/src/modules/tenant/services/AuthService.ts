import { TenantRepository } from "../respository";
import * as security from "../../../utils/security";
import { Tenant, NewTenant } from "../schema";
import { TenantRegisterInput, TenantLoginInput, TenantResponse } from "../zodSchema";
import { UnitOfWork } from "../../../repositories/UnitOfWork";


export class AuthService {
    async registerTenant(uow: UnitOfWork, payload: TenantRegisterInput): Promise<{ tenant: TenantResponse; token: string }> {
        // Check if tenant already exists
        return uow.execute(async (uow) => {
            const tenantRepository = uow.getRepository(TenantRepository);

            const existingTenant = await tenantRepository.getTenantByEmail(payload.email);
            if (existingTenant) {
                throw new Error("Tenant already exists with this email");
            }

            // Hash password with salt
            const { hashedPassword, salt } = security.hashPassword(payload.password);

            const newTenant: Partial<NewTenant> = {
                name: payload.name,
                email: payload.email,
                password: hashedPassword,
                salt: salt,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const tenant = await tenantRepository.createTenant(newTenant as NewTenant);

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

        });
    }


    async loginTenant(uow: UnitOfWork, payload: TenantLoginInput): Promise<{ tenant: TenantResponse; token: string }> {
        return uow.execute(async (uow) => {
            const tenantRepository = uow.getRepository(TenantRepository);
            // Find tenant by email
            const tenant = await tenantRepository.getTenantByEmail(payload.email);

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
        });

    }

    // sanitize tenant response to exclude sensitive information like password and salt
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
