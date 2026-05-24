import { useState } from "react";
import type { CreateWebhookRequest, Webhook } from "../types/types";
import type { Result, SuccessResponse } from "../../../types/APIResponse";
import type { AppError } from "../../../utils/AppErrors";
import { createWebHook } from "../../../services/webhook";

export function useCreateWebhook() {
    const [loading, setLoading] = useState(false);

    const createWebhook = async (
        payload: CreateWebhookRequest
    ): Promise<Result<SuccessResponse<Webhook>, AppError>> => {
        setLoading(true);
        const response = await createWebHook(payload);
        setLoading(false);
        return response;
    };

    return {
        createWebhook,
        loading,
    };
}