import { apiClient } from "../api";
import { ENDPOINTS } from "../api/endpoints";
import type { Result, SuccessResponse } from "../types/APIResponse";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types/auth.types";
import { NetworkError, getErrorMessage, toAppError, type AppError } from "../utils/AppErrors";


export type LoginPayload = LoginRequest;
export type RegisterPayload = RegisterRequest;

export const loginService = async (
  payload: LoginPayload,
): Promise<Result<SuccessResponse<AuthResponse>, AppError>> => {
  try {
    const response = await apiClient.post<AuthResponse>(
      {
        endpoint: ENDPOINTS.AUTH.LOGIN,
        body: payload,
      },
    )

    if (response.success) {
      return { ok: true, response };
    }
    
    return {
      ok: false,
      error: toAppError(response.error, response.message),
    };
  }
  catch(error) {
    const message = getErrorMessage(error, "Failed to log in. Please check your network connection");
    console.log("Login service error:", error);
    return { ok: false, error: new NetworkError(message) }
  }
};

export const registerService = async (
  payload: RegisterPayload
): Promise<Result<SuccessResponse<AuthResponse>, AppError>> => {
  try {
    const response = await apiClient.post<AuthResponse>(
      {
        endpoint: ENDPOINTS.AUTH.REGISTER,
        body: payload,
      }
    );
    if (response.success) {
      return { ok: true, response };
    }

    return {
      ok: false,
      error: toAppError(response.error, response.message),
    };
  }
  catch(error) {
    const message = getErrorMessage(error, "Failed to register. Please check your network connection");
    return { ok: false, error: new NetworkError(message) }
  }
};
