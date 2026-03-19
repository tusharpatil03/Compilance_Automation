import { Queue } from "bullmq";
import { db } from "../db/connection";
import { DrizzleUnitOfWork } from "../repositories/UnitOfWork";
import { EventManager } from "./EventManager";
import { RedisEventBus } from "./EventBus/EventBus";
import { EventProcessor } from "./EventProcessor/EventProcessor";
import { ListenerRegistry } from "./EventProcessor/ListenerRegistry";
import { OutboxPublisher } from "./OutBoxPublisher";
import { OutboxRepository } from "./Repository/Outbox";
import { registerListeners } from "./registerListeners";

let initialized = false;
let poller: NodeJS.Timeout | undefined;
let eventManager: EventManager | undefined;
let eventBus: RedisEventBus | undefined;

function getRedisConnection() {
    const host = process.env.REDIS_HOST ?? "127.0.0.1";
    const port = Number(process.env.REDIS_PORT ?? "6379");

    return { host, port };
}

export async function initEventRuntime(): Promise<void> {
    if (initialized) {
        return;
    }

    const queue = new Queue("domain-events", {
        connection: getRedisConnection(),
    });

    const registry = new ListenerRegistry();
    registerListeners(registry);

    eventBus = new RedisEventBus(queue);
    const processor = new EventProcessor(registry);

    await eventBus.subscribe(async (message) => {
        await processor.processEvent(message);
    });

    eventManager = new EventManager(new DrizzleUnitOfWork(db));

    const publisher = new OutboxPublisher(
        new OutboxRepository(db),
        eventBus,
        Number(process.env.OUTBOX_MAX_RETRIES ?? "5")
    );

    const pollIntervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? "5000");

    // Poll outbox in background to publish staged events.
    poller = setInterval(async () => {
        try {
            await publisher.publishOutBoxEvents();
        } catch (error) {
            console.error("Outbox polling failed:", error);
        }
    }, pollIntervalMs);

    initialized = true;
}

export function getEventManager(): EventManager {
    if (!eventManager) {
        throw new Error("Event runtime is not initialized");
    }

    return eventManager;
}

export async function shutdownEventRuntime(): Promise<void> {
    if (!initialized) {
        return;
    }

    if (poller) {
        clearInterval(poller);
        poller = undefined;
    }

    if (eventBus) {
        await eventBus.close();
        eventBus = undefined;
    }

    eventManager = undefined;
    initialized = false;
}
