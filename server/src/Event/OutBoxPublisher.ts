/**
    The OutboxPublisher is responsible for fetching unprocessed events from the outbox repository and publishing them to the event bus. 
    It ensures that events are published in a reliable manner, handling any errors that may occur during the publishing process. 
    The OutboxPublisher can be scheduled to run at regular intervals, ensuring that all events are eventually published even if there are temporary issues with the event bus or network.
 */

import { OutboxRepository } from "./Repository/Outbox";
import { EventBus, EventBusMessage } from "./EventBus/EventBus";

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
                await this.outboxRepo.incrementRetry(record.id);
            }
        }
    }
}