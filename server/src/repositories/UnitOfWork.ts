import { TenantAPIKeyRepository, TenantRepository } from "../modules/tenant/respository";
import { RiskProfileRepository, UserRepository } from "../modules/users/repository";
import { DrizzleClient } from "./BaseRepository";

export interface UnitOfWork {
    userRepository: UserRepository;
    riskProfileRepository: RiskProfileRepository;
    tenantRepository: TenantRepository;
    tenantApiKeyRepository: TenantAPIKeyRepository;

    run<T>(fn: ()=> Promise<T>): Promise<T>;
}


export class DrizzleUnitOfWork implements UnitOfWork {
    tenantRepository!: TenantRepository;
    tenantApiKeyRepository!: TenantAPIKeyRepository;
    userRepository!: UserRepository;
    riskProfileRepository!: RiskProfileRepository;

    constructor(private readonly db: DrizzleClient){}

    async run<T>(fn: () => Promise<T>): Promise<T> {
        return this.db.transaction(async (tx) => {
            // Initialize repositories with the transaction context
            this.userRepository = new UserRepository(tx);
            this.riskProfileRepository = new RiskProfileRepository(tx);
            this.tenantRepository = new TenantRepository(tx);
            this.tenantApiKeyRepository = new TenantAPIKeyRepository(tx);

            return fn();
        }); 
    }
}