import { db } from "../db/connection";
import { DrizzleClient } from "../repositories/BaseRepository";
import { DrizzleUnitOfWork } from "../repositories/UnitOfWork";
import { DomainEvent } from "./DomainEvents/DomainEvent";
import { EventStoreRepository } from "./DomainEvents/Repository/EventStore";
import { NewEventStoreRecord } from "./DomainEvents/Repository/schema";

export class EventManager {
    constructor(
        private readonly uow: DrizzleUnitOfWork = new DrizzleUnitOfWork(db)
    ) { }

    async publish(event: DomainEvent, tx: DrizzleClient): Promise<void> {
        //persist event to event store

        return this.uow.execute(async (uow) => {
            const eventRepo = uow.getRepository(EventStoreRepository);
            const EventRecord:NewEventStoreRecord = {
                tenant_id: event.tenantId,
                aggregate_id: event.aggregateId,
                event_type: event.constructor.name,
                payload: JSON.stringify(event),
                occurred_at: new Date().toISOString(),
                metadata: event.metadata ? JSON.stringify(event.metadata) : null,
            }

            await eventRepo.createEvent(EventRecord);
        });
    }
}