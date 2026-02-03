// Types for Tenant API Keys based on server/docs/tenants-api.md

export type ApiKeyStatus = 'active' | 'inactive';

export interface ApiKeyItem {
  id: number; // database id
  tenant_id: number;
  kid: string; // key id reference
  label?: string | null;
  status: ApiKeyStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  expires_at?: string | null; // ISO timestamp
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CreateApiKeyRequest {
  label?: string;
  expires_at?: string; // ISO timestamp
}

export interface CreateApiKeyResponse {
  message: string;
  api_key: string; // raw API key string, shown only once
  key: ApiKeyItem;
}

export interface DeactivateApiKeyRequest {
  status: 'inactive';
}

export interface SimpleMessageResponse {
  message: string;
}
