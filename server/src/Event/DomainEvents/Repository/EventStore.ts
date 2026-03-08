import { eq } from "drizzle-orm";
import { BaseRepository, DrizzleClient } from "../../../repositories/BaseRepository";
import { event_store, EventStoreRecord, NewEventStoreRecord } from "./schema";

interface IEventStoreRepository {
    createEvent(event: NewEventStoreRecord): Promise<EventStoreRecord>;
    getEventById(eventId: number): Promise<EventStoreRecord | null>;
}

export class EventStoreRepository extends BaseRepository<typeof event_store> implements IEventStoreRepository {
    constructor(db: DrizzleClient) {
        super(db, event_store);
    }

    //create event
    async createEvent(event: NewEventStoreRecord): Promise<EventStoreRecord> {
        const db = this.getDb();
        const [created] = await db.insert(this.table).values(event).returning();
        return created as unknown as EventStoreRecord;
    }

    //get event by event id
    async getEventById(eventId: number): Promise<EventStoreRecord | null> {
        const db = this.getDb();
        const event = await db
            .select()
            .from(this.table)
            .where(eq(this.table.id, eventId))
            .execute();
        return event[0] as unknown as EventStoreRecord || null;
    }
}