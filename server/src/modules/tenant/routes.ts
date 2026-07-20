// define routes for tenant module
import { Router } from 'express';
import { validagteBody } from '../../utils/inputValidator';
import {
  tenantApiKeyChangeStatusSchema,
  tenantApiKeyCreateSchema,
  tenantApiKeyListSchema,
  tenantApiKeyRemoveSchema,
  tenantLoginSchema,
  tenantRegisterSchema,
  tenantWebhookCreateSchema,
  tenantWebhookListSchema,
} from './zodSchema';
import { registerTenant } from './controllers/register';
import { loginTenant } from './controllers/login';
import { createApiKey } from './controllers/createApikey';
import { changeApiKeyStatus } from './controllers/changeApiKeyStatus';
import { removeApiKey } from './controllers/removeApiKey';
import { listApiKeys } from './controllers/listApiKeys';
import { createWebhook } from './controllers/createWebhook';
import { listWebhooks } from './controllers/listWebhooks';
import { deleteWebhook } from './controllers/deleteWebhook';
import { authenticateTenant } from './middlewares/auth';
import { injectParamsIntoBody } from '../../utils/InjectParamsIntoBody';

const router = Router();

// Authentication endpoints
router.post('/register', validagteBody(tenantRegisterSchema), registerTenant);
router.post('/login', validagteBody(tenantLoginSchema), loginTenant);

// API Key endpoints
router.post(
  '/api-keys',
  authenticateTenant,
  validagteBody(tenantApiKeyCreateSchema),
  createApiKey
);
router.get(
  '/api-keys',
  authenticateTenant,
  validagteBody(tenantApiKeyListSchema, 'query'),
  listApiKeys
);
router.delete(
  '/api-keys/:kid',
  authenticateTenant,
  validagteBody(tenantApiKeyRemoveSchema, 'params'),
  removeApiKey
);
router.patch(
  '/api-keys/:kid',
  authenticateTenant,
  injectParamsIntoBody,
  validagteBody(tenantApiKeyChangeStatusSchema),
  changeApiKeyStatus
);

// Webhook endpoints
router.post(
  '/webhooks',
  authenticateTenant,
  validagteBody(tenantWebhookCreateSchema),
  createWebhook
);
router.get(
  '/webhooks',
  authenticateTenant,
  validagteBody(tenantWebhookListSchema, 'query'),
  listWebhooks
);
router.delete('/webhooks/:id', authenticateTenant, deleteWebhook);

export default router;
