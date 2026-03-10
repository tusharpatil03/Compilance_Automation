import { eq } from "drizzle-orm";
import { BaseRepository, DrizzleClient } from "../../../repositories/BaseRepository";
import { outbox, OutboxRecord, NewOutboxRecord } from "./schema";

interface IOutboxRepository {
    createOutboxEntry(entry: NewOutboxRecord): Promise<OutboxRecord>;
    markAsProcessed(id: number): Promise<void>;
}

export class OutboxRepository extends BaseRepository<typeof outbox> implements IOutboxRepository {
    constructor(db: DrizzleClient) {
        super(db, outbox);
    }

    async createOutboxEntry(entry: NewOutboxRecord): Promise<OutboxRecord> {
        const db = this.getDb();
        const [created] = await db.insert(this.table).values(entry).returning();
        return created as unknown as OutboxRecord;
    }

    async markAsProcessed(id: number): Promise<void> {
        const db = this.getDb();
        await db
            .update(this.table)
            .set({ processed_at: new Date().toISOString(), processed: 1 })
            .where(eq(this.table.id, id))
            .execute(); 
    }

    async getUnprocessedEntries(): Promise<OutboxRecord[]> {
        const db = this.getDb();
        const entries = await db
            .select()
            .from(this.table)
            .where(eq(this.table.processed, 0))
            .execute();
        return entries as unknown as OutboxRecord[];
    }

    async deleteProcessedEntries(): Promise<void> {
        const db = this.getDb();
        await db
            .delete(this.table)
            .where(eq(this.table.processed, 1))
            .execute();
    }
}