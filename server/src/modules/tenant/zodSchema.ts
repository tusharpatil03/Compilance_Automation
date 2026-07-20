import z from 'zod';

// Custom validators
const isValidHttpsUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
};

// DB enum values for tenant status (kept in sync with DB schema)
export const tenantStatusEnum = z.enum([
  'active',
  'inactive',
  'suspended',
] as const);

// DB enum values for API key status
export const apiKeyStatusEnum = z.enum([
  'active',
  'inactive',
  'revoked',
] as const);

// Input schema used when registering a new tenant.
// Required: name, email, password
// Derived / server-generated: id, salt, created_at, updated_at, status (defaults to 'active')
export const tenantRegisterSchema = z.object({
  name: z
    .string()
    .min(3, 'Tenant name must be at least 3 characters long')
    .max(255, 'Tenant name must be at most 255 characters long')
    .trim(),

  email: z
    .string()
    .email('Invalid email address format')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase(),

  // Keep password constraints reasonable for raw passwords (not the stored hash)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must be at most 100 characters long')
    .regex(
      /^(?=.*[A-Z])/,
      'Password must contain at least one uppercase letter'
    )
    .regex(/^(?=.*[0-9])/, 'Password must contain at least one number')
    .regex(
      /^(?=.*[!@#$%^&*])/,
      'Password must contain at least one special character (!@#$%^&*)'
    ),
});

// Login schema - only email and raw password required
export const tenantLoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address format')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must be at most 100 characters'),
});

// Public tenant response (never include password or salt)
export const tenantResponseSchema = z.object({
  id: z.number().int().positive(),
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

// API Key schemas
export const tenantApiKeyCreateSchema = z.object({
  label: z
    .string()
    .min(1, 'Key ID (kid) is required')
    .max(128, 'Key ID must be at most 128 characters'),
  expires_at: z
    .string()
    .datetime()
    .refine(
      (value) => new Date(value) > new Date(),
      'Expiration date must be in the future'
    )
    .optional(),
});

export const tenantApiKeyChangeStatusSchema = z.object({
  kid: z
    .string()
    .min(1, 'Key ID (kid) is required')
    .max(128, 'Key ID must be at most 128 characters'),
  status: z
    .enum(['inactive', 'revoked'])
    .refine((val) => ['inactive', 'revoked'].includes(val), {
      message: "Status must be either 'inactive' or 'revoked'",
    }),
});

export const tenantApiKeyRemoveSchema = z.object({
  kid: z
    .string()
    .min(1, 'Key ID (kid) is required')
    .max(128, 'Key ID must be at most 128 characters'),
});

export const tenantApiKeyListSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  offset: z.coerce
    .number()
    .int()
    .min(0, 'Offset cannot be negative')
    .optional()
    .default(0),
});

// API Key response (sanitized - no api_key_hash)
export const tenantApiKeyResponseSchema = z.object({
  id: z.number().int().positive(),
  tenant_id: z.number().int().positive(),
  key_prefix: z.string(),
  status: apiKeyStatusEnum,
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
});

// Webhook schemas
export const tenantWebhookCreateSchema = z.object({
  url: z
    .string()
    .max(2048, 'Webhook URL must be at most 2048 characters')
    .refine(
      isValidHttpsUrl,
      'Webhook URL must be a valid HTTPS URL for security'
    ),
  events: z.array(z.string()).optional().default([]),
});

export const tenantWebhookListSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  offset: z.coerce
    .number()
    .int()
    .min(0, 'Offset cannot be negative')
    .optional()
    .default(0),
});

export const tenantWebhookResponseSchema = z.object({
  id: z.number().int().positive(),
  tenant_id: z.number().int().positive(),
  url: z.string(),
  events: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

// Inferred types
export type TenantApiKeyCreateInput = z.infer<typeof tenantApiKeyCreateSchema>;
export type TenantApiKeyChangeStatusInput = z.infer<
  typeof tenantApiKeyChangeStatusSchema
>;
export type TenantApiKeyRemoveInput = z.infer<typeof tenantApiKeyRemoveSchema>;
export type TenantApiKeyListInput = z.infer<typeof tenantApiKeyListSchema>;
export type TenantApiKeyResponse = z.infer<typeof tenantApiKeyResponseSchema>;
export type TenantWebhookCreateInput = z.infer<
  typeof tenantWebhookCreateSchema
>;
export type TenantWebhookListInput = z.infer<typeof tenantWebhookListSchema>;
export type TenantWebhookResponse = z.infer<typeof tenantWebhookResponseSchema>;
