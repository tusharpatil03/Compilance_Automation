import { BaseDomainEvent } from "./DomainEvent";

type KycCompletedPayload = {
    userId: string;
    status: "pending" |"approved" | "rejected";
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