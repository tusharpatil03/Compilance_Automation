export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/tenant/login",
    REGISTER: "/tenant/register",
  },
  API_KEYS: {
    LIST: "/tenant/api-keys",
    DETAIL: (kid: string) => `/tenant/api-keys/${kid}`,
    DEACTIVATE: (kid: string) => `/tenant/api-keys/${kid}`,
  },
  WEBHOOKS: {
    LIST: "/tenant/webhooks",
    CREATE: "/tenant/webhooks",
    DETAIL: (webhookId: string) => `/tenant/webhooks/${webhookId}`,
    DELETE: (webhookId: string) => `/tenant/webhooks/${webhookId}`,
  },
} as const;
