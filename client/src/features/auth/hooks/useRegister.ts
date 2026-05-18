import { useState } from "react";
import type { AuthResponse, FormErrors, RegisterRequest } from "../../../types/auth.types";
import { registerService } from "../../../services/authServices";
import { NetworkError, getErrorMessage, type AppError } from "../../../utils/AppErrors";
import type { Result, SuccessResponse } from "../../../types/APIResponse";


export function useRegister() {
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [response, setResponse] = useState<AuthResponse | null>(null);

    // Registration form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });


    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        });
        setError(null);
        setFieldErrors({});
    };


    const clearFieldError = (field: string) => {
        setFieldErrors((prev) => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    };

    const handleRegister = async (): Promise<Result<SuccessResponse<AuthResponse>, AppError>> => {
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const registrationData: RegisterRequest = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            };

            // Service already handles errors and returns normalized ApiResponse
            const result = await registerService(registrationData);

            if (result.ok) {
                setIsRegistered(true);
                setResponse(result.response.data);
                resetForm();
            } else {
                setError(result.error.message);

                if (result.error.type === "validation" && result.error.field !== "") {
                    setFieldErrors({ [result.error.field]: result.error.message });
                }
            }

            return result;
        } catch (err) {
            // This shouldn't happen as service catches all errors, but fallback just in case
            console.error("Unexpected error in handleRegister:", err);
            const errorMessage = getErrorMessage(err, "An unexpected error occurred");
            setError(errorMessage);
            return {
                ok: false,
                error: new NetworkError(errorMessage),
            } as Result<SuccessResponse<AuthResponse>, AppError>;
        } finally {
            setLoading(false);
        }
    };

    return {
        isRegistered,
        loading,
        error,
        fieldErrors,
        formData,
        setFormData,
        handleRegister,
        resetForm,
        clearFieldError,
        response,
    };
}
