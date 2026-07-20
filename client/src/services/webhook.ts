import { apiClient } from "../api";
import { ENDPOINTS } from "../api/endpoints";
import type {
  CreateWebhookRequest,
  Webhook,
  WebhookListParams,
} from "../features/webhooks/types/types";
import type { Result, SuccessResponse } from "../types/APIResponse";
import { getErrorMessage, NetworkError, toAppError, type AppError } from "../utils/AppErrors";

export async function createWebHook(
  payload: CreateWebhookRequest,
): Promise<Result<SuccessResponse<Webhook>, AppError>> {
  try {
    const response = await apiClient.post<Webhook>({
      endpoint: ENDPOINTS.WEBHOOKS.CREATE,
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
      "Failed to create webhook. Please check your network connection",
    );
    return {
      ok: false,
      error: new NetworkError(message),
    };
  }
}

export async function listWebhooks(
  params: WebhookListParams = {},
): Promise<Result<SuccessResponse<Webhook[]>, AppError>> {
  try {
    const response = await apiClient.get<Webhook[]>({
      endpoint: ENDPOINTS.WEBHOOKS.LIST,
      query: {
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
      },
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
      "Failed to fetch webhooks. Please check your network connection",
    );
    return {
      ok: false,
      error: new NetworkError(message),
    };
  }
}

export async function deleteWebhook(
  webhookId: number,
): Promise<Result<SuccessResponse<never>, AppError>> {
  try {
    const response = await apiClient.delete<never>({
      endpoint: ENDPOINTS.WEBHOOKS.DELETE(String(webhookId)),
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
      "Failed to delete webhook. Please check your network connection",
    );
    return {
      ok: false,
      error: new NetworkError(message),
    };
  }
}
