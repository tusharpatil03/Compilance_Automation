import z from "zod";

export const RegisterUserSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(6, "password must be at least 6 characters long")
        .max(22, "password must be at most 100 characters long")
        .regex(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
            message:
                "Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*)",
        }),
    tenant_id: z.number(),
    external_customer_id: z.string(),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    role: z.string().min(1, "Role is required"),
});

export const LoginUserSchema = z.object({
    email: z.string().email(),
    password: z.string()
})