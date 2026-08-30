import { BaseRepository } from '../../../../repositories/BaseRepository';
import { Identity } from '../entities/Identity';

export interface IdentityRepository {
    findById(id: string): Promise<Identity | null>;
    findByContact(email?: string | null, phoneNumber?: string | null): Promise<Identity | null>;
    save(identity: Identity): Promise<Identity>;
}
