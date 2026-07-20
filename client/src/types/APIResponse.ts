export type SuccessResponse<T> = {
  success: true; // literal true = discriminant
  status: number;
  message: string;
  data: T; // required, not optional
  pagination?: {
    limit: number;
    offset: number;
    count: number;
  };
};

type ServerErrorType = "VALIDATION_ERROR" | "AUTH_ERROR" | "NOT_FOUND" | "SERVER_ERROR";

export type ValidationIssue = {
  field: string;
  message: string;
  code?: string;
};

export type ServerErrorResponse = {
  success: false; // literal false = discriminant
  status: number;
  message: string;
  error: {
    type: ServerErrorType;
    code: string;
    field?: string;
    issues?: ValidationIssue[];
  };
};

export type APIResponse<T> = SuccessResponse<T> | ServerErrorResponse;

// Result stays the same — wraps the whole operation
export type Result<T, E> = { ok: true; response: T } | { ok: false; error: E };
