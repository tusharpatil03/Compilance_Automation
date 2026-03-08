export interface EventBusMessage<T = unknown> {
    eventId: number
    eventType: string
    tenantId: number
    aggregateId: number
    version: number
    occurredAt: string
    payload: T
}

export interface EventBus {
    publish(message: EventBusMessage): Promise<void>
    subscribe(
        eventType: string,
        handler: (message: EventBusMessage) => Promise<void>
    ): Promise<void>
}

import {Queue, Worker} from "bullmq";

export class RedisEventBus implements EventBus {

    constructor(
        private readonly queue: Queue
    ) { }

    async publish(message: EventBusMessage): Promise<void> {
        await this.queue.add(
            message.eventType,
            message,
            {
                removeOnComplete: true,
                attempts: 5
            }
        )
    }

    async subscribe(
        eventType: string,
        handler: (msg: EventBusMessage) => Promise<void>
    ): Promise<void> {

        new Worker(
            this.queue.name,
            async job => {
                if (job.name !== eventType) return
                await handler(job.data)
            }
        )
    }
}