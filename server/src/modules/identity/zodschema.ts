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

export type RegisterIdentityInput = z.infer<typeof RegisterIdentity>;
