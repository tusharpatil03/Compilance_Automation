import z, { email } from "zod";

export const SyncUser = z.object({
    api_key: z.string().min(1, "API key is required"),
    api_key_id: z.string().min(1, "API key ID is required"),
    external_customer_id: z.string().min(1, "External customer id is required"),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    phone: z.string().min(7, "Phone number must be at least 7 digits"),
});

export type SyncUserInput = z.infer<typeof SyncUser>;