import { axiosProtected } from '../../../hooks/useAxiosPrivate';
import type { 
  ApiKeyItem, 
  PaginatedResponse, 
  CreateApiKeyRequest, 
  CreateApiKeyResponse, 
  SimpleMessageResponse 
} from '../types/apiKey.types';

export async function listApiKeys(limit = 10, offset = 0) {
  const res = await axiosProtected.get<PaginatedResponse<ApiKeyItem>>('/tenant/api-keys', {
    params: { limit, offset }
  });
  return res.data;
}

export async function createApiKey(payload: CreateApiKeyRequest) {
  const res = await axiosProtected.post<CreateApiKeyResponse>('/tenant/api-keys', payload);
  return res.data;
}

export async function deactivateApiKey(kid: string) {
  const res = await axiosProtected.post<SimpleMessageResponse>(`/tenant/api-keys/${kid}`, { status: 'inactive' });
  return res.data;
}

export async function deleteApiKey(kid: string) {
  const res = await axiosProtected.delete<SimpleMessageResponse>(`/tenant/api-keys/${kid}`);
  return res.data;
}
