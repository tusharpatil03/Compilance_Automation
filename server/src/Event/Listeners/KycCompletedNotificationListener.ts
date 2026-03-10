import { EventBusMessage } from "../EventBus/EventBus";

export function KycCompletedNotificationListener() {
    return {
        eventType: "KycCompletedEvent",
        async handle(event: EventBusMessage) {
            console.log(`Handling KYC Completed Event: ${event.payload}`);
            // Here you would implement the logic to send a notification, e.g., email or SMS
            // For example:
            // await NotificationService.sendKycCompletedNotification(event.payload.userId);
        }
    }
}