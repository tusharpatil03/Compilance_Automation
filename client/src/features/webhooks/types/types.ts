
export type Webhook = {
    id: number;
    tenant_id: number;
    url: string;
    events: string[];
    created_at: string;
    updated_at: string;
};

export type CreateWebhookRequest = {
    url: string;
    events?: string[];
};

export type WebhookListParams = {
    limit?: number;
    offset?: number;
};

export const WEBHOOK_EVENTS = [
    "api_key.created",
    "api_key.deactivated",
    "api_key.revoked",
    "tenant.updated",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];