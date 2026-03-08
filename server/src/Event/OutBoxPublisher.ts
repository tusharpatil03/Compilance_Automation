import { OutboxRepository } from "./DomainEvents/Repository/Outbox";
import { EventBus, EventBusMessage } from "./EventBus";

export class OutboxPublisher {
    constructor(
        private readonly outboxRepo: OutboxRepository,
        private readonly eventBus: EventBus
    ) { }

    async publishOutBoxEvents() {
        const events = await this.outboxRepo.getUnprocessedEntries();

        for (const record of events) {
            try {
                const message: EventBusMessage = {
                    eventId: record.id,
                    eventType: record.event_type,
                    tenantId: record.tenant_id,
                    aggregateId: record.aggregate_id,
                    version: 1, //versioning can be added later
                    occurredAt: record.occurred_at,
                    payload: record.payload
                }

                await this.eventBus.publish(message);

                await this.outboxRepo.markAsProcessed(record.id);

            } catch (err) {
                //increment retry count and log error for monitoring
                console.error(`Failed to publish event ${record.id} of type ${record.event_type}:`, err);
                // await this.outboxRepo.incrementRetry(record.id);
            }
        }
    }
}