import { ListenerRegistry } from './EventProcessor/ListenerRegistry';
import { KycCompletedNotificationListener } from './Listeners/KycCompletedNotificationListener';

export function registerListeners(registry: ListenerRegistry): void {
  registry.register(KycCompletedNotificationListener());
}
