// Type definitions based on Tenants API documentation

export interface Tenant {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface AuthPayload {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string; // e.g., "1h"
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | Record<string, string>;
  errors?: Record<string, string>; // For validation errors
}

export interface AuthResponse {
  tenant: Tenant;
  auth: AuthPayload;
}

export interface FormErrors {
  [key: string]: string;
}
