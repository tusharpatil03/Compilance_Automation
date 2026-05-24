import type { APIResponse } from '../types/APIResponse';
import type { IConfig } from './APILayer';

export const authInterceptor = (token?: string) => (config: IConfig) => {
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
};

export const authWithLoggingInterceptor = (token?: string) => (config: IConfig) => {
    console.log(`[API] ${config.endpoint}`, { param: config.param, query: config.query });

    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
};

// Resopnse Interceptor to handle auth errors globally
// it Error.message includes "Unauthorized" or "Forbidden", we can trigger a logout or show a notification to the user.
export const authErrorInterceptor = (response: APIResponse<unknown>) => {
    if (response.success) {
        return;
    }

    if (response.error && (response.error.code.includes("ERR_401") || response.status === 401)) {
        // change the auth state in local storage to false
        localStorage.setItem("auth", "false");
        // Optionally, you can also trigger a logout or show a notification to the user here.
        console.warn("Authentication error detected. User has been logged out.");
    }
}
