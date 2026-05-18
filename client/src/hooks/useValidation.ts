import { useState, useCallback } from "react";
import type { ValidationResult } from "../utils/validation";


export const useFormValidation = (
  initialErrors: Record<string, string> = {}
) => {
  const [errors, setErrors] = useState<Record<string, string>>(initialErrors);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);


  const handleValidationResult = useCallback(
    (field: string, validationResult: ValidationResult) => {
      if (validationResult.isValid) {
        clearError(field);
      } else if (validationResult.error) {
        setError(field, validationResult.error);
      }
      return validationResult.isValid;
    },
    [clearError, setError]
  );


  const validateFields = useCallback(
    (validations: Record<string, ValidationResult>): boolean => {
      const newErrors: Record<string, string> = {};

      Object.entries(validations).forEach(([field, result]) => {
        if (!result.isValid && result.error) {
          newErrors[field] = result.error;
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    []
  );

  return {
    errors,
    setErrors,
    setError,
    clearError,
    clearAllErrors,
    handleValidationResult,
    validateFields,
    hasErrors: Object.keys(errors).length > 0,
  };
};

/**
 * Custom hook for validation with real-time feedback
 * @param onValidationChange - Callback when validation state changes
 * @returns Validation helpers
 */
export const useValidationFeedback = (
  onValidationChange?: (isValid: boolean) => void
) => {
  const [validationState, setValidationState] = useState<
    Record<string, boolean>
  >({});

  const updateValidation = useCallback(
    (field: string, isValid: boolean) => {
      setValidationState((prev) => {
        const updated = { ...prev, [field]: isValid };
        const allValid = Object.values(updated).every(Boolean);
        onValidationChange?.(allValid);
        return updated;
      });
    },
    [onValidationChange]
  );

  const isFieldValid = useCallback(
    (field: string): boolean => {
      return validationState[field] ?? true;
    },
    [validationState]
  );

  const allFieldsValid = useCallback((): boolean => {
    return Object.values(validationState).every(Boolean);
  }, [validationState]);

  const reset = useCallback(() => {
    setValidationState({});
  }, []);

  return {
    validationState,
    updateValidation,
    isFieldValid,
    allFieldsValid,
    reset,
  };
};
