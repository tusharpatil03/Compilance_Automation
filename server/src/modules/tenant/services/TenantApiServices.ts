import { db } from '../../../db/connection';
import {
  TenantAPIKeyRepository,
  TenantRepository,
  WebhookRepository,
} from '../respository';
import { NewTenantApiKey, NewWebhook, TenantApiKey, Webhook } from '../schema';
import { createHmac } from 'crypto';
import { ApiError } from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';

interface ITenantApiServices {
  createApiKey(payload: NewTenantApiKey): Promise<TenantApiKey>;
  deactivateApiKey(key_prefix: string, tenantId: number): Promise<void>;
  revokeApiKey(key_prefix: string, tenantId: number): Promise<void>;
  removeApiKey(key_prefix: string, tenantId: number): Promise<void>;
  listApiKeys(
    tenantId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<TenantApiKey[]>;
  validateApiKey(key_prefix: string, tenantId: number): Promise<boolean>;
  createWebhook(payload: NewWebhook): Promise<Webhook>;
  getWebHooks(
    tenantId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<Webhook[]>;
  deleteWebhook(id: number, tenantId: number): Promise<void>;
}

export class TenantApiServices implements ITenantApiServices {
  private tenantApiKeyRepository: TenantAPIKeyRepository;
  private tenantRepository: TenantRepository;
  private webhookRepository: WebhookRepository;

  constructor() {
    this.tenantApiKeyRepository = new TenantAPIKeyRepository(db);
    this.tenantRepository = new TenantRepository(db);
    this.webhookRepository = new WebhookRepository(db);
  }

  async createApiKey(payload: NewTenantApiKey): Promise<TenantApiKey> {
    // Validate tenant
    if (!payload.tenant_id) {
      throw new Error('Tenant ID is required to create an API key.');
    }
    const tenant = await this.tenantRepository.getTenantById(payload.tenant_id);
    if (!tenant) {
      throw new Error(`Tenant with ID ${payload.tenant_id} does not exist.`);
    }

    // Normalize payload fields
    const toCreate: NewTenantApiKey = {
      tenant_id: payload.tenant_id,
      api_key_hash: payload.api_key_hash,
      key_prefix: payload.key_prefix,
      api_key: payload.api_key, // encrypted api key from controller
      expires_at: payload.expires_at,
      status: 'active',
    } as NewTenantApiKey;

    const newApiKey = await this.tenantApiKeyRepository.createApiKey(toCreate);
    return newApiKey;
  }

  async deactivateApiKey(key_prefix: string, tenantId: number): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const existingKey = await this.tenantApiKeyRepository.getApiKeyByKey_prefix(
      key_prefix,
      tenantId
    );
    if (!existingKey) {
      throw new Error(`API key with prefix ${key_prefix} does not exist.`);
    }

    if (existingKey.tenant_id !== tenantId) {
      throw new Error('Forbidden: key does not belong to tenant');
    }

    if (existingKey.status === 'inactive') {
      // idempotent - already inactive
      return;
    }

    await this.tenantApiKeyRepository.changeStatus(existingKey.id, 'inactive');
  }

  async revokeApiKey(key_prefix: string, tenantId: number): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const existingKey = await this.tenantApiKeyRepository.getApiKeyByKey_prefix(
      key_prefix,
      tenantId
    );
    if (!existingKey) {
      throw new Error(`API key with prefix ${key_prefix} does not exist.`);
    }

    if (existingKey.tenant_id !== tenantId) {
      throw new Error('Forbidden: key does not belong to tenant');
    }

    if (existingKey.status === 'revoked') {
      // idempotent - already revoked
      return;
    }

    await this.tenantApiKeyRepository.revokeApiKey(existingKey.id);
  }

  async removeApiKey(key_prefix: string, tenantId: number): Promise<void> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const existingKey = await this.tenantApiKeyRepository.getApiKeyByKey_prefix(
      key_prefix,
      tenantId
    );
    if (!existingKey) {
      throw new Error(`API key with prefix ${key_prefix} does not exist.`);
    }

    if (existingKey.tenant_id !== tenantId) {
      throw new Error('Forbidden: key does not belong to tenant');
    }

    await this.tenantApiKeyRepository.removeApiKey(existingKey.id);
  }

  listApiKeys(
    tenantId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<TenantApiKey[]> {
    return this.tenantApiKeyRepository.getApiKeysByTenantId(tenantId, options);
  }

  async validateApiKey(key_prefix: string, tenantId: number): Promise<boolean> {
    const apiKey = await this.tenantApiKeyRepository.getActiveApiKeyByKeyPrefix(
      key_prefix,
      tenantId
    );

    if (!apiKey) {
      return false;
    }

    // Check if key has expired
    if (apiKey.expires_at) {
      const now = new Date();
      const expiryDate = new Date(apiKey.expires_at);
      if (now > expiryDate) {
        return false;
      }
    }

    // Check if key is not revoked
    if (apiKey.status === 'revoked') {
      return false;
    }

    // Check if key is not inactive
    if (apiKey.status === 'inactive') {
      return false;
    }

    return true;
  }

  //webhook services
  async createWebhook(payload: NewWebhook): Promise<Webhook> {
    // Validate tenant
    const tenant = await this.tenantRepository.getTenantById(payload.tenant_id);
    if (!tenant) {
      throw new Error(`Tenant with ID ${payload.tenant_id} does not exist.`);
    }

    const supportedEvents = [
      'api_key.created',
      'api_key.deactivated',
      'api_key.rotated',
      'tenant.updated',
    ];
    const requestedEvents = payload.events ?? [];
    const selectedEvents = requestedEvents.length
      ? requestedEvents.filter((event) => supportedEvents.includes(event))
      : supportedEvents;

    if (requestedEvents.length > 0 && selectedEvents.length === 0) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'No supported events provided',
        400
      );
    }

    const secret = createHmac(
      'sha256',
      process.env.WEBHOOK_SECRET || 'default_secret'
    )
      .update(`${payload.tenant_id}:${payload.url}:${Date.now()}`)
      .digest('hex');

    // Normalize payload fields
    const toCreate: NewWebhook = {
      tenant_id: payload.tenant_id,
      url: payload.url,
      events: selectedEvents,
      secret,
    } as NewWebhook;

    const newWebhook = await this.webhookRepository.createWebhook(toCreate);
    return newWebhook;
  }

  getWebHooks(
    tenantId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<Webhook[]> {
    return this.webhookRepository.getWebhooksByTenantId(tenantId, options);
  }

  async deleteWebhook(id: number, tenantId: number): Promise<void> {
    // Verify webhook belongs to tenant
    const webhooks =
      await this.webhookRepository.getWebhooksByTenantId(tenantId);
    const webhook = webhooks.find((w) => w.id === id);

    if (!webhook) {
      throw new Error('Webhook not found or does not belong to your tenant');
    }

    await this.webhookRepository.deleteWebhook(id);
  }
}
