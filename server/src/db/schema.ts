import {
    tenantSchema,
    TenantStatus,
    tenants,
    tenants_api_key,
    webhooks,
    ApiKeyStatus,
} from '../modules/tenant/schema';
import {
    identitySchema,
    accountStatusEnum,
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
    identityVerificationStatusEnum,
    documentStatusEnum,
    verificationStageEnum,
    verificationStatusEnum,
    stageResultEnum,
    otpPurposeEnum,
    otpChannelEnum,
    tokenTypeEnum,
} from '../modules/identity/infrastructure/persistence/schema';
import { eventSchema, event_store, outbox } from '../Event/Repository/schema';

// Central schema object for Drizzle initialization
const schema = {
    ...identitySchema,
    ...tenantSchema,
    ...eventSchema,
};

export default schema;

//dirzzle will track these exports
export { identitySchema };
export { tenantSchema };
export { eventSchema };
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
export { otpPurposeEnum };
export { otpChannelEnum };
export { tokenTypeEnum };

export type AppSchema = typeof schema;
