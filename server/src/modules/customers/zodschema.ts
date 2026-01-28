import z from "zod";

export const SyncCustomer = z.object({
    tenant_id: z.number(),
    external_customer_id: z.string(),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    risk_score: z.number().min(0).max(100).optional(),
});