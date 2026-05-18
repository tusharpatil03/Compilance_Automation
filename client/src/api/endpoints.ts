/**
 * Centralized API endpoint constants
 * This ensures single source of truth for all API routes
 */

export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/tenant/login',
        REGISTER: '/tenant/register'
    },
    API_KEYS: {
        LIST: '/tenant/api-keys',
        DETAIL: (kid: string) => `/tenant/api-keys/${kid}`,
        DEACTIVATE: (kid: string) => `/tenant/api-keys/${kid}`
    }
} as const;
