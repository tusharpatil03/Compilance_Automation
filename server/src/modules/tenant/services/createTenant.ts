import { db } from "../../../db/connection";
import { generateApiKey, hashApiKey, hashPasword } from "../../../utils/security";
import { TenantRepository } from "../respository";

type TenantPayload = {
    name: string;
    email: string;
    password: string;
}
// create a tenant service
export const createTenant = async (payload:TenantPayload) => {
    try {
        const tenantRepository = new TenantRepository(db);
        const existingTenant = await tenantRepository.getTenantByEmail(payload.email);
        if (existingTenant) {
            throw new Error("Tenant already exists with this name");
        }

        //hash password
        const { hashedPassword, salt} = hashPasword(payload.password);

        // generate api key and hash it
        const api_key = generateApiKey();
        const hashed_api_key = hashApiKey(api_key);

        const tenant = await tenantRepository.createTenant({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            salt: salt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        return tenant;
    }
    catch (error) {
        console.error("Error in createTenant service:", error);
        throw Error(`Error creating tenant`);
    }
}