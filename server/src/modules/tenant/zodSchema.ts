import z from "zod";

// DB enum values for tenant status (kept in sync with DB schema)
export const tenantStatusEnum = z.enum(["active", "inactive", "suspended"] as const);

// Input schema used when registering a new tenant.
// Required: name, email, password
// Derived / server-generated: id, salt, created_at, updated_at, status (defaults to 'active')
export const tenantRegisterSchema = z.object({
    name: z
        .string()
        .min(3, "Tenant name must be at least 3 characters long")
        .max(255, "Tenant name must be at most 255 characters long")
        .trim(),

    email: z.string().email("Invalid email address").max(255),

    // Keep password constraints reasonable for raw passwords (not the stored hash)
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(100, "Password must be at most 100 characters long")
        .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
            message:
                "Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*)",
        }),
});

// Login schema - only email and raw password required
export const tenantLoginSchema = z.object({
    email: z.string().email("Invalid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters long").max(100),
});

// Public tenant response (never include password or salt)
export const tenantResponseSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    status: tenantStatusEnum,
    created_at: z.string(), // ISO timestamp from DB
    updated_at: z.string(), // ISO timestamp from DB
});

// Inferred TypeScript types for convenience
export type TenantRegisterInput = z.infer<typeof tenantRegisterSchema>;
export type TenantLoginInput = z.infer<typeof tenantLoginSchema>;
export type TenantResponse = z.infer<typeof tenantResponseSchema>;

export const tenantApiKeyCreateSchema = z.object({
    tenant_id: z.number().min(1, "Valid tenant ID is required").optional(),
    label: z.string().max(255).optional(),
    expires_at: z.string().optional(), // ISO timestamp string
});

export const tenanatApiKeyChangeSchema = z.object({
    status: z.union([z.literal("active"), z.literal("inactive")]),
});

export type TenantApiKeyCreateInput = z.infer<typeof tenantApiKeyCreateSchema>;