import { tenants, tenants_api_key, TenantStatus } from "../modules/tenant/schema";
import { users, risk_profile } from "../modules/users/schema";

// Central schema object for Drizzle initialization
const schema = {
    users,
    tenants,
    tenants_api_key,
    risk_profile
};
export default schema;

//dirzzle will track these exports
export {users}
export {tenants}
export {tenants_api_key}
export {TenantStatus}
export {risk_profile}

export type AppSchema = typeof schema;