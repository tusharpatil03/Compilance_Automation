/**
 * Comprehensive validation utility library
 * Provides validation functions with optional state callbacks for React components
 */

// ============ TYPES ============
export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export type StateCallback<T> = (value: T) => void;
export type ErrorCallback = (error: string) => void;

// ============ EMAIL VALIDATION ============

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates email with error callback
 * @param email - Email string to validate
 * @param onError - Optional callback to handle error message
 * @returns ValidationResult object
 */
export const validateEmail = (email: string, onError?: ErrorCallback): ValidationResult => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    const error = "Email is required";
    onError?.(error);
    return { isValid: false, error };
  }

  if (!isValidEmail(trimmedEmail)) {
    const error = "Please enter a valid email address";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

// ============ PASSWORD VALIDATION ============

export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePassword = (password: string, onError?: ErrorCallback): ValidationResult => {
  if (!password) {
    const error = "Password is required";
    onError?.(error);
    return { isValid: false, error };
  }

  if (password.length < 8) {
    const error = "Password must be at least 8 characters";
    onError?.(error);
    return { isValid: false, error };
  }

  if (!isValidPassword(password)) {
    const error =
      "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
  onError?: ErrorCallback,
): ValidationResult => {
  if (!confirmPassword) {
    const error = "Please confirm your password";
    onError?.(error);
    return { isValid: false, error };
  }

  if (password !== confirmPassword) {
    const error = "Passwords do not match";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

// ============ DATE VALIDATION ============

export const isValidDateFormat = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateDate = (dateString: string, onError?: ErrorCallback): ValidationResult => {
  if (!dateString) {
    const error = "Date is required";
    onError?.(error);
    return { isValid: false, error };
  }

  if (!isValidDateFormat(dateString)) {
    const error = "Please enter a valid date (YYYY-MM-DD)";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

export const validateFutureDate = (
  dateString: string,
  onError?: ErrorCallback,
): ValidationResult => {
  const dateValidation = validateDate(dateString, onError);
  if (!dateValidation.isValid) return dateValidation;

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    const error = "Date must be in the future";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

export const validatePastDate = (dateString: string, onError?: ErrorCallback): ValidationResult => {
  const dateValidation = validateDate(dateString, onError);
  if (!dateValidation.isValid) return dateValidation;

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (date > today) {
    const error = "Date must not be in the future";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

// ============ TEXT/STRING VALIDATION ============

export const validateTextLength = (
  text: string,
  minLength: number = 1,
  maxLength: number = Infinity,
  onError?: ErrorCallback,
): ValidationResult => {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    const error = "This field is required";
    onError?.(error);
    return { isValid: false, error };
  }

  if (trimmedText.length < minLength) {
    const error = `Minimum ${minLength} characters required`;
    onError?.(error);
    return { isValid: false, error };
  }

  if (trimmedText.length > maxLength) {
    const error = `Maximum ${maxLength} characters allowed`;
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

export const validateRequired = (
  text: string,
  fieldName: string = "This field",
  onError?: ErrorCallback,
): ValidationResult => {
  if (!text || !text.trim()) {
    const error = `${fieldName} is required`;
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

// ============ NAME VALIDATION ============

export const validateName = (
  name: string,
  minLength: number = 3,
  maxLength: number = 255,
  onError?: ErrorCallback,
): ValidationResult => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    const error = "Name is required";
    onError?.(error);
    return { isValid: false, error };
  }

  if (trimmedName.length < minLength) {
    const error = `Name must be at least ${minLength} characters`;
    onError?.(error);
    return { isValid: false, error };
  }

  if (trimmedName.length > maxLength) {
    const error = `Name must not exceed ${maxLength} characters`;
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

// ============ NUMBER VALIDATION ============

export const validateNumberRange = (
  value: string | number,
  min: number = 0,
  max: number = Infinity,
  onError?: ErrorCallback,
): ValidationResult => {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    const error = "Please enter a valid number";
    onError?.(error);
    return { isValid: false, error };
  }

  if (num < min) {
    const error = `Value must be at least ${min}`;
    onError?.(error);
    return { isValid: false, error };
  }

  if (num > max) {
    const error = `Value must not exceed ${max}`;
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

export const validatePositiveNumber = (
  value: string | number,
  onError?: ErrorCallback,
): ValidationResult => {
  return validateNumberRange(value, 0, Infinity, onError);
};

// ============ URL VALIDATION ============

export const validateURL = (url: string, onError?: ErrorCallback): ValidationResult => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    const error = "URL is required";
    onError?.(error);
    return { isValid: false, error };
  }

  try {
    new URL(trimmedUrl);
    return { isValid: true };
  } catch {
    const error = "Please enter a valid URL";
    onError?.(error);
    return { isValid: false, error };
  }
};

export const validateHttpsUrl = (url: string, onError?: ErrorCallback): ValidationResult => {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    const error = "URL is required";
    onError?.(error);
    return { isValid: false, error };
  }

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "https:") {
      const error = "URL must start with https://";
      onError?.(error);
      return { isValid: false, error };
    }
    return { isValid: true };
  } catch {
    const error = "Please enter a valid HTTPS URL";
    onError?.(error);
    return { isValid: false, error };
  }
};

// ============ PHONE VALIDATION ============

export const validatePhoneNumber = (phone: string, onError?: ErrorCallback): ValidationResult => {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    const error = "Phone number is required";
    onError?.(error);
    return { isValid: false, error };
  }

  // Basic phone validation: 10-15 digits, allows +, -, and spaces
  const phoneRegex = /^[\d\s+\-()]{10,15}$/;

  if (!phoneRegex.test(trimmedPhone)) {
    const error =
      "Please enter a valid phone number (10-15 characters, digits, +, -, spaces, and parentheses allowed)";
    onError?.(error);
    return { isValid: false, error };
  }

  // Count only digits
  const digits = trimmedPhone.replace(/\D/g, "");
  if (digits.length < 10) {
    const error = "Phone number must contain at least 10 digits";
    onError?.(error);
    return { isValid: false, error };
  }

  return { isValid: true };
};

// ============ CUSTOM VALIDATION ============

export const validatePattern = (
  value: string,
  pattern: RegExp,
  errorMessage: string = "Invalid format",
  onError?: ErrorCallback,
): ValidationResult => {
  if (!pattern.test(value)) {
    onError?.(errorMessage);
    return { isValid: false, error: errorMessage };
  }

  return { isValid: true };
};

// ============ BATCH VALIDATION ============

export const validateAll = (...validations: ValidationResult[]): boolean => {
  return validations.every((result) => result.isValid);
};

/**
 * Collects all validation errors
 * @param validations - Array of validation functions that return ValidationResult
 * @returns Array of error messages
 */
export const collectErrors = (...validations: ValidationResult[]): string[] => {
  return validations
    .filter((result) => !result.isValid && result.error)
    .map((result) => result.error as string);
};

// ============ REACT HOOK INTEGRATION HELPERS ============

/**
 * Creates a validation handler for form fields with state callback
 * @param validator - Validation function that returns ValidationResult
 * @param onValidError - Callback when validation fails
 * @param onValidSuccess - Optional callback when validation succeeds
 * @returns Handler function
 */
export const createValidationHandler = <T extends string | number>(
  validator: (value: T) => ValidationResult,
  onValidError: ErrorCallback,
  onValidSuccess?: () => void,
) => {
  return (value: T) => {
    const result = validator(value);
    if (!result.isValid && result.error) {
      onValidError(result.error);
    } else {
      onValidSuccess?.();
    }
  };
};

/**
 * Validates multiple fields and updates errors state
 * @param fields - Object with field names and values
 * @param validators - Object with field names and their validation functions
 * @param onErrorsUpdate - Callback to update errors state
 * @returns true if all fields are valid
 */
export const validateFields = <T extends Record<string, unknown>>(
  fields: T,
  validators: {
    [K in keyof T]?: (value: T[K]) => ValidationResult;
  },
  onErrorsUpdate: (errors: Record<string, string>) => void,
): boolean => {
  const errors: Record<string, string> = {};

  Object.entries(validators).forEach(([field, validator]) => {
    if (validator) {
      const result = validator(fields[field]);
      if (!result.isValid && result.error) {
        errors[field] = result.error;
      }
    }
  });

  onErrorsUpdate(errors);
  return Object.keys(errors).length === 0;
};
