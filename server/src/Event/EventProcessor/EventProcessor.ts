import { EventBusMessage } from '../EventBus/EventBus';
import { ListenerRegistry } from './ListenerRegistry';

export class EventProcessor {
  constructor(private readonly listnerReg: ListenerRegistry) {}

  async processEvent<T>(event: EventBusMessage) {
    const listeners = this.listnerReg.getListeners(event.eventType);

    for (const listener of listeners) {
      try {
        await listener.handle(event);
      } catch (err) {
        console.error(`Error processing event ${event.eventType}:`, err);
      }
    }
  }
}
