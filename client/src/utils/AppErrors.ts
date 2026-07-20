import type { ServerErrorResponse } from "../types/APIResponse";

// Base — shared shape, never instantiated directly
abstract class APPERROR extends Error {
  abstract readonly type: string;
  readonly code?: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Network / client-side failure — no server context available
export class NetworkError extends APPERROR {
  readonly type = "network" as const;

  constructor(message = "Network error occurred") {
    super(message);
  }
}

// Server rejected the request — has a code, no specific field
export class ServerError extends APPERROR {
  readonly type = "server" as const;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Server rejected a specific input field — code + field both guaranteed
export class ValidationError extends APPERROR {
  readonly type = "validation" as const;
  readonly code: string;
  readonly field: string;

  constructor(code: string, field: string, message: string) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

// Union exported for use in Result<T, E>
export type AppError = NetworkError | ServerError | ValidationError;

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
}

export function toAppError(error: ServerErrorResponse["error"], message: string): AppError {
  switch (error.type) {
    case "VALIDATION_ERROR":
      return new ValidationError(
        error.code,
        error.issues?.[0]?.field ?? error.field ?? "",
        error.issues?.[0]?.message ?? message,
      );
    case "AUTH_ERROR":
    case "NOT_FOUND":
    case "SERVER_ERROR":
      return new ServerError(error.code, message);
    default:
      return new ServerError("UNKNOWN_ERROR", message);
  }
}
