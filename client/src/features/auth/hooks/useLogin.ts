import { useState } from "react";
import type { LoginRequest } from "../../../types/auth.types";
import { loginService } from "../../../services/authServices";
import type { AppError } from "../../../utils/AppErrors";
import type { Result, SuccessResponse } from "../../../types/APIResponse";
import type { AuthResponse } from "../../../types/auth.types";

export function useLogin() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<AppError | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const handleLogin = async (data: LoginRequest): Promise<Result<SuccessResponse<AuthResponse>, AppError>> => {
        setLoading(true);
        setError(null);

        try {
            const result = await loginService(data);
            if(result.ok){
            setSuccess(true);
            } else {
            setError(result.error);
            setSuccess(false);
            }

            return result;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        handleLogin,
        success
    };
}
