import type { APIResponse } from "../types/APIResponse";

export interface IConfig {
    endpoint: string;
    param?: string;
    query?: Record<string, string | number>;
    headers?: Record<string, unknown>;
    body?: unknown;
}

type ReqInterceptor = (config: IConfig) => void | Promise<void>;
type ResInterceptor = (response: unknown) => void | Promise<void>;

export class APILayer {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    private async executeRequest<T>(
        method: string,
        config: IConfig,
        reqInterceptor?: ReqInterceptor[],
        resInterceptor?: ResInterceptor[]
    ): Promise<APIResponse<T>> {

        config.headers = {
            ...config.headers,
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Origin": "localhost:4000",
            authorization: "Bearer ",
        };

        // Run interceptor first (before any request building)
        if (reqInterceptor && reqInterceptor?.length > 0) {
            for (const interceptor of reqInterceptor) {
                await interceptor(config);
            }
        }

        // Build URL
        const url = new URL(config.endpoint, this.baseURL);

        if (config.query) {
            Object.keys(config.query).forEach(key => {
                url.searchParams.append(key, String(config.query![key]));
            });
        }


        // Build fetch options
        const fetchOptions: RequestInit = {
            method,
            headers: {
                // Only add Content-Type if there's a body
                ...(config.body ? { 'Content-Type': 'application/json' } : {}),
                ...(config.headers || {})
            }
        };

        // Add body for methods that support it
        if (method !== 'GET' && method !== 'DELETE' && config.body) {
            fetchOptions.body = JSON.stringify(config.body);
        }

        // Execute request
        const response = await fetch(url.toString(), {
            ...fetchOptions,
            credentials: 'include', // Ensure cookies are sent with the request
        });
        
        const responseData = await response.json();

        console.log(`[API] ${method} ${url.toString()}`, { request: config, response: responseData });

        // Run response interceptor before returning data
        if (resInterceptor && resInterceptor?.length > 0) {
            for (const interceptor of resInterceptor) {
                await interceptor(responseData);
            }
        }

        return responseData;
    }

    async get<T>(config: IConfig, reqInterceptor?: ReqInterceptor[], resInterceptor?: ResInterceptor[]): Promise<APIResponse<T>> {
        return this.executeRequest<T>('GET', config, reqInterceptor, resInterceptor);
    }

    async post<T>(config: IConfig, reqInterceptor?: ReqInterceptor[], resInterceptor?: ResInterceptor[]): Promise<APIResponse<T>> {
        return this.executeRequest<T>('POST', config, reqInterceptor, resInterceptor);
    }

    async put<T>(config: IConfig, reqInterceptor?: ReqInterceptor[], resInterceptor?: ResInterceptor[]): Promise<APIResponse<T>> {
        return this.executeRequest<T>('PUT', config, reqInterceptor, resInterceptor);
    }

    async patch<T>(config: IConfig, reqInterceptor?: ReqInterceptor[], resInterceptor?: ResInterceptor[]): Promise<APIResponse<T>> {
        return this.executeRequest<T>('PATCH', config, reqInterceptor, resInterceptor);
    }

    async delete<T>(config: IConfig, reqInterceptor?: ReqInterceptor[], resInterceptor?: ResInterceptor[]): Promise<APIResponse<T>> {
        return this.executeRequest<T>('DELETE', config, reqInterceptor, resInterceptor);
    }
}