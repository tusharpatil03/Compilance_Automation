import { and, eq, gt, isNull } from 'drizzle-orm';
import type { DrizzleClient } from '../../../../repositories/BaseRepository';
import {
    otpCodes,
    type NewOtpCode,
} from './schema';
import type {
    OtpChannel,
    OtpCode,
    OtpCodeRepository,
    OtpPurpose,
} from '../../domain/repositories/OtpCodeRepository';

function toDomain(row: typeof otpCodes.$inferSelect): OtpCode {
    return {
        id: row.id,
        identityId: row.identity_id,
        purpose: row.purpose,
        channel: row.channel,
        codeHash: row.code_hash,
        attempts: row.attempts,
        maxAttempts: row.max_attempts,
        expiresAt: new Date(row.expires_at),
        consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
    };
}

export class DrizzleOtpCodeRepository implements OtpCodeRepository {
    constructor(private readonly db: DrizzleClient) { }

    async save(code: OtpCode): Promise<OtpCode> {
        const payload: NewOtpCode = {
            id: code.id,
            identity_id: code.identityId,
            purpose: code.purpose,
            channel: code.channel,
            code_hash: code.codeHash,
            attempts: code.attempts,
            max_attempts: code.maxAttempts,
            expires_at: code.expiresAt.toISOString(),
            consumed_at: code.consumedAt?.toISOString() ?? null,
            created_at: new Date().toISOString(),
        };
        const [created] = await this.db.insert(otpCodes).values(payload).returning();
        if (!created) {
            throw new Error('Failed to create OTP code');
        }
        return toDomain(created);
    }

    async findActive(
        identityId: string,
        purpose: OtpPurpose,
        channel: OtpChannel
    ): Promise<OtpCode | null> {
        const [row] = await this.db
            .select()
            .from(otpCodes)
            .where(
                and(
                    eq(otpCodes.identity_id, identityId),
                    eq(otpCodes.purpose, purpose),
                    eq(otpCodes.channel, channel),
                    isNull(otpCodes.consumed_at),
                    gt(otpCodes.expires_at, new Date().toISOString())
                )
            )
            .limit(1);
        return row ? toDomain(row) : null;
    }

    async consume(id: string, consumedAt: Date): Promise<void> {
        await this.db
            .update(otpCodes)
            .set({ consumed_at: consumedAt.toISOString() })
            .where(eq(otpCodes.id, id));
    }

    async incrementAttempts(id: string): Promise<void> {
        const [current] = await this.db
            .select({ attempts: otpCodes.attempts })
            .from(otpCodes)
            .where(eq(otpCodes.id, id))
            .limit(1);
        if (current) {
            await this.db
                .update(otpCodes)
                .set({ attempts: current.attempts + 1 })
                .where(eq(otpCodes.id, id));
        }
    }
}
