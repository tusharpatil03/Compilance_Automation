import { tenants, tenants_api_keys, TenantStatus, KeyEnvironment } from "../modules/tenant/schema";
import { users } from "../modules/customers/schema";

// Central schema object for Drizzle initialization
const schema = {
    users,
    tenants,
    tenants_api_keys,
};
export default schema;

//dirzzle will track these exports
export {users}
export {tenants}
export {tenants_api_keys}
export {TenantStatus}
export {KeyEnvironment}

export type AppSchema = typeof schema;