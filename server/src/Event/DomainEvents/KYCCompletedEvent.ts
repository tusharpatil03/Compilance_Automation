import { BaseDomainEvent } from "./DomainEvent";

export type KycStatus = "pending" | "approved" | "rejected";

type KycCompletedPayload = {
    userId: string;
    status: KycStatus;
    riskScore: number;
};

export class KycCompletedEvent extends BaseDomainEvent<KycCompletedPayload> {
    constructor(
        aggregateId: number,
        tenantId: number,
        payload: KycCompletedPayload
    ) {
        super("kyc.completed", aggregateId, tenantId, payload);
    }
}