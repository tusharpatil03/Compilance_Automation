import { EventBusMessage } from '../EventBus/EventBus';

export function KycCompletedNotificationListener() {
  return {
    eventType: 'kyc.completed',
    async handle(event: EventBusMessage) {
      console.log(`Handling KYC Completed Event: ${event.payload}`);
    },
  };
}
