import { z } from 'zod';

export const RegisterIdentity = z
    .object({
        email: z.string().email('Invalid email address').optional(),
        phone_number: z
            .string()
            .min(7, 'Phone number must be at least 7 digits')
            .optional(),
        full_name: z.string().min(1, 'Full name is required').optional(),
    })
    .refine((data) => Boolean(data.email || data.phone_number), {
        message: 'Either email or phone number is required',
        path: ['email'],
    });

export const VerifyEmail = z.object({
    identity_id: z.string().min(1, 'Identity id is required'),
    code: z.string().min(1, 'Verification code is required'),
});

export const VerifyPhone = z.object({
    identity_id: z.string().min(1, 'Identity id is required'),
    code: z.string().min(1, 'Verification code is required'),
});

export type RegisterIdentityInput = z.infer<typeof RegisterIdentity>;
export type VerifyEmailInput = z.infer<typeof VerifyEmail>;
export type VerifyPhoneInput = z.infer<typeof VerifyPhone>;
