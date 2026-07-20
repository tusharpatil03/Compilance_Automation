/**
    The EventManager is responsible for managing the lifecycle of domain events, including publishing events to the event store. 
    It interacts with the Unit of Work to ensure that events are persisted in a consistent manner, and can be extended to include additional functionality such as event validation or transformation before publishing.
 */

import { db } from '../db/connection';
import { DrizzleUnitOfWork } from '../repositories/UnitOfWork';
import { DomainEvent } from './DomainEvents/DomainEvent';
import { EventStoreRepository } from './Repository/EventStore';
import { OutboxRepository } from './Repository/Outbox';
import { NewEventStoreRecord, NewOutboxRecord } from './Repository/schema';

export class EventManager {
  constructor(
    private readonly uow: DrizzleUnitOfWork = new DrizzleUnitOfWork(db)
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    //persist event to event store

    return this.uow.execute(async (uow) => {
      const eventRepo = uow.getRepository(EventStoreRepository);
      const EventRecord: NewEventStoreRecord = {
        tenant_id: event.tenantId,
        aggregate_id: event.aggregateId,
        event_type: event.eventType,
        payload: event.payload,
        occurred_at: event.occurredAt.toISOString(),
        metadata: event.metadata ?? {},
      };

      const createdEvent = await eventRepo.createEvent(EventRecord);

      const outboxRepo = uow.getRepository(OutboxRepository);

      const outboxRecord: NewOutboxRecord = {
        event_id: createdEvent.id,
        tenant_id: event.tenantId,
        aggregate_id: event.aggregateId,
        event_type: event.eventType,
        payload: event.payload,
        occurred_at: event.occurredAt.toISOString(),
        metadata: event.metadata ?? {},
      };
      await outboxRepo.createOutboxEntry(outboxRecord);
    });
  }
}
