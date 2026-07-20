# Event-Driven Architecture (Server)

This module implements an event-driven pipeline using:

1. Domain Events for business intent.
2. Transactional Event Store + Outbox for reliability.
3. BullMQ (Redis-backed) Event Bus for async delivery.
4. Listener Registry + Event Processor for event handling.

The current delivery model is at-least-once.

## Why this architecture exists

The design solves two common problems in distributed/business workflows:

1. Consistency: event creation and staging are committed in one database transaction.
2. Reliability: if Redis or consumers are temporarily unavailable, events remain in outbox and can be retried.

## End-to-end event flow

1. A domain action creates a DomainEvent object.
2. EventManager persists the event to event_store and outbox in one UnitOfWork transaction.
3. A background OutboxPublisher poller claims pending outbox rows.
4. Each claimed row is published to BullMQ through RedisEventBus.
5. On successful publish, outbox row is marked processed.
6. Worker receives jobs from queue and forwards payload to EventProcessor.
7. EventProcessor fetches listeners by eventType and invokes them.

## Runtime wiring and lifecycle

The event runtime is initialized once at server startup and shut down gracefully on process termination.

- Startup bootstrap: [src/Event/runtime.ts](runtime.ts)
- Server startup/shutdown hooks: [src/server.ts](../server.ts)
- Listener registration at boot: [src/Event/registerListeners.ts](registerListeners.ts)

Initialization includes:

1. Create BullMQ Queue domain-events.
2. Create ListenerRegistry and register listeners.
3. Create RedisEventBus.
4. Subscribe a single Worker handler to route events into EventProcessor.
5. Create EventManager instance.
6. Start background outbox poller.

Shutdown includes:

1. Stop outbox polling interval.
2. Close BullMQ Worker.
3. Close BullMQ Queue connection.

## Core components

## 1) Domain Event contract

- File: [src/Event/DomainEvents/DomainEvent.ts](DomainEvents/DomainEvent.ts)
- Purpose: typed event envelope for business events.
- Key fields:

1. eventId: UUID for event identity.
2. eventType: canonical routing key (example: kyc.completed).
3. aggregateId, tenantId: business partitioning.
4. version: schema evolution control.
5. occurredAt: event timestamp.
6. payload, metadata: event data.

Concrete example:

- [src/Event/DomainEvents/KYCCompletedEvent.ts](DomainEvents/KYCCompletedEvent.ts)

## 2) EventManager (transactional staging)

- File: [src/Event/EventManager.ts](EventManager.ts)
- Responsibility: write into event_store and outbox atomically.

Behavior:

1. Stores canonical eventType from event.eventType.
2. Persists structured payload/metadata as JSONB.
3. Inserts event_store row first, captures created id.
4. Inserts outbox row referencing event_store.id through outbox.event_id.

Why this matters:

1. Prevents lost events when app crashes after DB write but before bus publish.
2. Keeps event history (event_store) separate from delivery state (outbox).

## 3) Database schema (event store + outbox)

- File: [src/Event/Repository/schema.ts](Repository/schema.ts)

Tables:

1. event_store
2. outbox

Important columns in outbox:

1. processed: delivery state flag.
2. retries: retry count.
3. processed_at: terminal/success timestamp.
4. event_id: FK to event_store.id.

State values for processed currently used by code:

1. 0 = pending
2. 2 = claimed/in-flight by poller
3. 1 = published successfully
4. -1 = terminal failure after max retries

## 4) OutboxRepository (delivery state transitions)

- File: [src/Event/Repository/Outbox.ts](Repository/Outbox.ts)

Key methods:

1. claimUnprocessedEntries(limit, maxRetries): claims pending rows by setting processed to 2.
2. markAsProcessed(id): sets processed to 1 and processed_at timestamp.
3. incrementRetry(id): increments retries.
4. releaseClaimForRetry(id): resets processed to 0 for next attempt.
5. markAsFailed(id): sets processed to -1 for terminal failure.

This claim model reduces duplicate publication when multiple pollers exist.

## 5) OutboxPublisher (background dispatcher)

- File: [src/Event/OutBoxPublisher.ts](OutBoxPublisher.ts)

Behavior:

1. Polls claimed rows (batch size 100).
2. Builds EventBusMessage and publishes to EventBus.
3. On success, marks outbox row processed.
4. On failure, increments retries.
5. If retries reach maxRetries, marks row failed.
6. Otherwise releases claim for retry.

## 6) RedisEventBus (BullMQ adapter)

- File: [src/Event/EventBus/EventBus.ts](EventBus/EventBus.ts)

Responsibilities:

1. publish(message): enqueue job in BullMQ queue named by eventType.
2. subscribe(handler): create a single Worker instance and dispatch job.data.
3. close(): close worker and queue connections.

Current job options:

1. attempts: 5
2. removeOnComplete: false (keeps completed jobs for diagnostics/replay analysis)

## 7) ListenerRegistry + EventProcessor

- Registry: [src/Event/EventProcessor/ListenerRegistry.ts](EventProcessor/ListenerRegistry.ts)
- Processor: [src/Event/EventProcessor/EventProcessor.ts](EventProcessor/EventProcessor.ts)

Pattern:

1. Listeners are registered once at startup.
2. Processor resolves handlers by message.eventType.
3. Each handler executes with try/catch isolation.

Example listener:

- [src/Event/Listeners/KycCompletedNotificationListener.ts](Listeners/KycCompletedNotificationListener.ts)

## Configuration

The runtime reads these environment variables:

1. REDIS_HOST (default 127.0.0.1)
2. REDIS_PORT (default 6379)
3. OUTBOX_MAX_RETRIES (default 5)
4. OUTBOX_POLL_INTERVAL_MS (default 5000)

## Reliability guarantees (current)

What is guaranteed:

1. Atomic event staging to event_store + outbox.
2. Retry-based outbox dispatch.
3. At-least-once delivery semantics.

What is not guaranteed:

1. Exactly-once processing.
2. Global ordering across all event types/aggregates.
3. Automatic dead-letter recovery workflow (state exists, workflow manual).

Listener implementations must be idempotent.

## Operational notes

1. If Redis is unavailable, events remain in outbox and will retry later.
2. If publish succeeds but downstream listener fails, BullMQ retries at worker/job level.
3. If outbox retry ceiling is reached, row is marked failed and requires manual handling/replay.

## How to trigger a sample event

For development testing, a route exists:

- [src/Event/testRoute.ts](testRoute.ts)

Mounted path in app:

- [src/app.ts](../app.ts)

Trigger endpoint:

1. GET /event/trigger_event

This should:

1. Create event_store row.
2. Create linked outbox row.
3. Publish to queue by poller.
4. Execute matching listener.

## Known improvement areas

1. Add explicit idempotency store/check per listener.
2. Add structured logging with correlation ids.
3. Add metrics for outbox lag, retries, failures, publish throughput.
4. Add automated dead-letter replay tooling.
5. Move sample test route to dev-only guard if needed.
