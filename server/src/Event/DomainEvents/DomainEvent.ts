export interface DomainEvent<TPayload = unknown> {
    readonly eventId: string;
    readonly eventType: string;
    readonly aggregateId: number;
    readonly tenantId: number;
    readonly version: number;
    readonly occurredAt: Date;
    readonly payload: TPayload;
    readonly metadata?: Record<string, unknown>;
}

import { randomUUID } from "crypto";

export abstract class BaseDomainEvent<TPayload = unknown> implements DomainEvent<TPayload> {
    readonly eventId: string;
    readonly occurredAt: Date;
    readonly version: number = 1;

    constructor(
        public readonly eventType: string,
        public readonly aggregateId: number,
        public readonly tenantId: number,
        public readonly payload: TPayload,
        public readonly metadata?: Record<string, unknown>
    ) {
        this.eventId = randomUUID();
        this.occurredAt = new Date();
    }
}