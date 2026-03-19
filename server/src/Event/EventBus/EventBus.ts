
/**
    The EventBus is a simple implementation of the publish-subscribe pattern using Redis as the underlying message broker. 
    It allows for decoupling of event producers and consumers, enabling a more scalable and maintainable architecture. 
    The EventBusMessage interface defines the structure of the messages that are published and consumed, 
    while the EventBus interface defines the methods for publishing and subscribing to events. 
    The RedisEventBus class implements the EventBus interface using BullMQ, a popular library for working with Redis queues in Node.js.
 */

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
        handler: (message: EventBusMessage) => Promise<void>
    ): Promise<void>
    close?(): Promise<void>
}

import { Queue, Worker } from "bullmq";

export class RedisEventBus implements EventBus {
    private worker?: Worker;

    constructor(
        private readonly queue: Queue
    ) { }

    async publish(message: EventBusMessage): Promise<void> {
        await this.queue.add(
            message.eventType,
            message,
            {
                removeOnComplete: false,
                attempts: 5
            }
        )
    }

    async subscribe(
        handler: (msg: EventBusMessage) => Promise<void>
    ): Promise<void> {
        if (this.worker) {
            return;
        }

        this.worker = new Worker(
            this.queue.name,
            async job => {
                await handler(job.data)
            },
            {
                connection: this.queue.opts.connection,
            }
        )
    }

    async close(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.worker = undefined;
        }

        await this.queue.close();
    }
}