import { apiClient } from "../api";
import { ENDPOINTS } from "../api/endpoints";
import { NetworkError, getErrorMessage, toAppError, type AppError } from "../utils/AppErrors";
import type { APIResponse, Result, SuccessResponse } from "../types/APIResponse";
import type { ApiKeyItem, CreateApiKeyRequest, CreateApiKeyResponse } from "../types/apiKey.types";

export const listApiKeys = async (
  limit = 10,
  offset = 0,
): Promise<Result<SuccessResponse<ApiKeyItem[]>, AppError>> => {
  try {
    const response = await apiClient.get<ApiKeyItem[]>({
      endpoint: ENDPOINTS.API_KEYS.LIST,
      query: { limit, offset },
    });

    if (!response.success) {
      return {
        ok: false,
        error: toAppError(response.error, response.message),
      };
    }

    return { ok: true, response };
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to fetch API keys. Please check your network connection",
    );
    return {
      ok: false,
      error: new NetworkError(message),
    };
  }
};

export const createApiKey = async (
  payload: CreateApiKeyRequest,
): Promise<Result<SuccessResponse<CreateApiKeyResponse>, AppError>> => {
  try {
    const response = await apiClient.post<CreateApiKeyResponse>({
      endpoint: ENDPOINTS.API_KEYS.LIST,
      body: payload,
    });

    if (!response.success) {
      return {
        ok: false,
        error: toAppError(response.error, response.message),
      };
    }

    return { ok: true, response };
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to create API key. Please check your network connection",
    );
    return {
      ok: false,
      error: new NetworkError(message),
    };
  }
};

export const deactivateApiKey = async (
  kid: string,
): Promise<Result<APIResponse<never>, AppError>> => {
  try {
    const response = await apiClient.patch<never>({
      endpoint: ENDPOINTS.API_KEYS.DEACTIVATE(kid),
      body: { status: "inactive" },
    });

    if (!response.success) {
      return {
        ok: false,
        error: toAppError(response.error, response.message),
      };
    }

    return { ok: true, response };
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to deactivate API key. Please check your network connection",
    );
    return {
      ok: false,
      error: new NetworkError(message),
    };
  }
};

export const deleteApiKey = async (kid: string): Promise<Result<APIResponse<never>, AppError>> => {
  try {
    const response = await apiClient.delete<never>({
      endpoint: ENDPOINTS.API_KEYS.DETAIL(kid),
    });

    if (!response.success) {
      return {
        ok: false,
        error: toAppError(response.error, response.message),
      };
    }

    return { ok: true, response };
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to delete API key. Please check your network connection",
    );
    return { ok: false, error: new NetworkError(message) };
  }
};
