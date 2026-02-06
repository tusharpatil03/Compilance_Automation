import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { RiskProfileRepository, UserRepository } from "../repository";
import { NewUser, User } from "../schema";
import { db } from "../../../db/connection";
import { UnitOfWork } from "../../../repositories/UnitOfWork";

export class UserServices {
    private userRepository: UserRepository;
    constructor(db: NodePgDatabase<any>) {
        this.userRepository = new UserRepository(db);
    }

    public async createUser(uow: UnitOfWork, payload: NewUser): Promise<User> {
        if (!payload.tenant_id) {
            throw new Error("Tenant id is required");
        }
        if (!payload.external_customer_id) {
            throw new Error("external_customer_id is required");
        }

        // Always run sync inside a transaction so user + risk_profile are consistent.
        return uow.run(async () => {
            const now = new Date().toISOString();
            const existing = await uow.userRepository.getUserByExternalIdAndTenant(
                payload.external_customer_id,
                payload.tenant_id
            );

            if (existing) {
                const updatedUser = await uow.userRepository.updateUserForTenant(existing.external_customer_id, payload.tenant_id, {
                    name: payload.name,
                    email: payload.email,
                    phone: payload.phone,
                    status: payload.status ?? existing.status,
                    updated_at: now,
                });

                const risk = await uow.riskProfileRepository.getRiskProfileByUserId(updatedUser.id);
                if (!risk) {
                    await uow.riskProfileRepository.createRiskProfile({
                        user_id: updatedUser.id,
                        risk_score: 0,
                    });
                }

                return updatedUser;
            }

            const createdUser = await uow.userRepository.createUser({
                ...payload,
                status: payload.status ?? "active",
                created_at: payload.created_at ?? now,
                updated_at: now,
            });

            await uow.riskProfileRepository.createRiskProfile({
                user_id: createdUser.id,
                risk_score: 0,
            });

            return createdUser;
        });
    }
}