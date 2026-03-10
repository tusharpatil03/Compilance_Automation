## Domain Events
Domain event defines the events that can be emmited or consumed by the system.
it defines the type of event, each domain can have different types and payload.
it outlines the event by defining it's unique name, payload.

## Types
- `KYCcompletedEvent`: Emitted when a user completes the KYC process. Payload includes user ID and timestamp.

Outline:

```typescript
export interface KYCcompletedEvent {
  type: 'KYCcompletedEvent';
  payload: {
    userId: string;
    timestamp: Date;
  };
}
```