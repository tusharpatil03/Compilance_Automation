import { EventBusMessage } from "../EventBus/EventBus"

export interface DomainEventListener<T = unknown> {
    eventType: string
    handle(event: EventBusMessage<T>): Promise<void>
}


export class ListenerRegistry {

    private listeners =
        new Map<string, DomainEventListener[]>()

    register(listener: DomainEventListener) {

        const list =
            this.listeners.get(listener.eventType) ?? []

        list.push(listener)

        this.listeners.set(listener.eventType, list)
    }

    getListeners(eventType: string) {
        return this.listeners.get(eventType) ?? []
    }

}