import { and, eq, lt, sql } from 'drizzle-orm';
import {
  BaseRepository,
  DrizzleClient,
} from '../../repositories/BaseRepository';
import { outbox, OutboxRecord, NewOutboxRecord } from './schema';

interface IOutboxRepository {
  createOutboxEntry(entry: NewOutboxRecord): Promise<OutboxRecord>;
  markAsProcessed(id: number): Promise<void>;
}

export class OutboxRepository
  extends BaseRepository<typeof outbox>
  implements IOutboxRepository
{
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

  async getUnprocessedEntries(maxRetries = 5): Promise<OutboxRecord[]> {
    const db = this.getDb();
    const entries = await db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.processed, 0), lt(this.table.retries, maxRetries))
      )
      .execute();
    return entries as unknown as OutboxRecord[];
  }

  async claimUnprocessedEntries(
    limit = 100,
    maxRetries = 5
  ): Promise<OutboxRecord[]> {
    const db = this.getDb();
    const candidates = await db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.processed, 0), lt(this.table.retries, maxRetries))
      )
      .limit(limit)
      .execute();

    const claimed: OutboxRecord[] = [];

    for (const candidate of candidates) {
      const [locked] = await db
        .update(this.table)
        .set({ processed: 2 })
        .where(
          and(eq(this.table.id, candidate.id), eq(this.table.processed, 0))
        )
        .returning()
        .execute();

      if (locked) {
        claimed.push(locked as unknown as OutboxRecord);
      }
    }

    return claimed;
  }

  async deleteProcessedEntries(): Promise<void> {
    const db = this.getDb();
    await db.delete(this.table).where(eq(this.table.processed, 1)).execute();
  }

  async incrementRetry(id: number): Promise<void> {
    const db = this.getDb();
    await db
      .update(this.table)
      .set({ retries: sql`${this.table.retries} + 1` })
      .where(eq(this.table.id, id))
      .execute();
  }

  async releaseClaimForRetry(id: number): Promise<void> {
    const db = this.getDb();
    await db
      .update(this.table)
      .set({ processed: 0 })
      .where(eq(this.table.id, id))
      .execute();
  }

  async markAsFailed(id: number): Promise<void> {
    const db = this.getDb();
    await db
      .update(this.table)
      .set({ processed: -1, processed_at: new Date().toISOString() })
      .where(eq(this.table.id, id))
      .execute();
  }
}
