import { RiskProfileRepository, UserRepository } from "../repository";
import { NewUser, User } from "../schema";
import { UnitOfWork } from "../../../repositories/UnitOfWork";

export class UserServices {
    public async createUser(uow: UnitOfWork, payload: NewUser): Promise<User> {
        if (!payload.tenant_id) {
            throw new Error("Tenant id is required");
        }
        if (!payload.external_customer_id) {
            throw new Error("external_customer_id is required");
        }

        // Always run sync inside a transaction so user + risk_profile are consistent.
        return uow.execute<User>(async (uow) => {
            const now = new Date().toISOString();

            const userRepository = uow.getRepository(UserRepository);
            const riskProfileRepository = uow.getRepository(RiskProfileRepository);

            const existing = await userRepository.getUserByExternalIdAndTenant(
                payload.external_customer_id,
                payload.tenant_id
            );

            if (existing) {
                const updatedUser = await userRepository.updateUserForTenant(existing.external_customer_id, payload.tenant_id, {
                    name: payload.name,
                    email: payload.email,
                    phone: payload.phone,
                    status: payload.status ?? existing.status,
                    updated_at: now,
                });

                const risk = await riskProfileRepository.getRiskProfileByUserId(updatedUser.id);
                if (!risk) {
                    await riskProfileRepository.createRiskProfile({
                        user_id: updatedUser.id,
                        risk_score: 0,
                    });
                }

                return updatedUser;
            }

            const createdUser = await userRepository.createUser({
                ...payload,
                status: payload.status ?? "active",
                created_at: payload.created_at ?? now,
                updated_at: now,
            });

            await riskProfileRepository.createRiskProfile({
                user_id: createdUser.id,
                risk_score: 0,
            });

            return createdUser;
        });
    }
}