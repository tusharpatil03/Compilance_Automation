import {
  tenants,
  tenants_api_key,
  TenantStatus,
  webhooks,
  ApiKeyStatus,
} from '../modules/tenant/schema';
import {
  identities,
  identityProfiles,
  identityProfileHistory,
  identityStatusHistory,
  credentials,
  otpCodes,
  sessions,
  documents,
  documentVersions,
  documentExtractions,
  verifications,
  verificationStageResults,
  accountStatusEnum,
  identityVerificationStatusEnum,
  documentStatusEnum,
  verificationStageEnum,
  verificationStatusEnum,
  stageResultEnum,
} from '../modules/identity/schema';
import { event_store, outbox } from '../Event/Repository/schema';

// Central schema object for Drizzle initialization
const schema = {
  identities,
  identityProfiles,
  identityProfileHistory,
  identityStatusHistory,
  credentials,
  otpCodes,
  sessions,
  tenants,
  tenants_api_key,
  event_store,
  outbox,
  webhooks,
  documents,
  documentVersions,
  documentExtractions,
  verifications,
  verificationStageResults,
};

export default schema;

//dirzzle will track these exports
export { identities };
export { identityProfiles };
export { identityProfileHistory };
export { identityStatusHistory };
export { credentials };
export { otpCodes };
export { sessions };
export { tenants };
export { tenants_api_key };
export { TenantStatus };
export { event_store };
export { outbox };
export { webhooks };
export { documents };
export { documentVersions };
export { documentExtractions };
export { verifications };
export { verificationStageResults };
export { ApiKeyStatus };
export { accountStatusEnum };
export { identityVerificationStatusEnum };
export { documentStatusEnum };
export { verificationStageEnum };
export { verificationStatusEnum };
export { stageResultEnum };

export type AppSchema = typeof schema;
