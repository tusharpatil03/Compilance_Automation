import { axiosClient } from "../../../api/axiosClient";
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from "../types/auth.types";

export type LoginPayload = LoginRequest;
export type RegisterPayload = RegisterRequest;

async function loginService(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    try {
        const response = await axiosClient.post<ApiResponse<AuthResponse>>(
            '/tenant/login', 
            payload
        );
        return response.data;
    } catch (error: unknown) {
        console.error('Login error:', error);
        throw error;
    }
}

const registerService = async (payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> => {
    try {
        const response = await axiosClient.post<ApiResponse<AuthResponse>>(
            '/tenant/register', 
            payload
        );
        return response.data;
    } catch (error: unknown) {
        console.error('Registration error:', error);
        throw error;
    }
}

export { loginService, registerService };