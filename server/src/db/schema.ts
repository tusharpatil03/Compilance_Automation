import { tenants, tenants_api_key, TenantStatus, webhooks, ApiKeyStatus } from "../modules/tenant/schema";
import { customers, risk_profile, documents } from "../modules/customer/schema";
import { event_store, outbox } from "../Event/Repository/schema";

// Central schema object for Drizzle initialization
const schema = {
    customers,
    tenants,
    tenants_api_key,
    risk_profile,
    event_store,
    outbox,
    webhooks,
    documents,
};

export default schema;

//dirzzle will track these exports
export { customers }
export { tenants }
export { tenants_api_key }
export { TenantStatus }
export { risk_profile }
export { event_store }
export { outbox }
export { webhooks }
export { documents }
export {ApiKeyStatus}

export type AppSchema = typeof schema;