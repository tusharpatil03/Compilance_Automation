## Event Module
this module contains the implementation of the event bus and the event processors. The event bus is responsible for publishing and subscribing to events, while the event processors are responsible for processing the events and updating the state of the application accordingly. The event bus is implemented using Redis as the underlying message broker, while the event processors are implemented using BullMQ, a popular library for working with Redis queues in Node.js.

