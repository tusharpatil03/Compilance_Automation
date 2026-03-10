/*
    The DomainEvent interface defines the structure of a domain event, which includes properties such as eventId, eventType, aggregateId, tenantId, version, occurredAt, payload, and optional metadata.
    The BaseDomainEvent class provides a base implementation of the DomainEvent interface, generating a unique eventId and setting the occurredAt timestamp when an event is created. 
    This class can be extended by specific domain events to include additional properties or methods as needed.
*/

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