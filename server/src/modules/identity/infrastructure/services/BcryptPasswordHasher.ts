import bcrypt from 'bcryptjs';
import { hashPassword } from '../../../../utils/security';
import type { PasswordHasher } from '../../application/ports/PasswordHasher';

export class BcryptPasswordHasher implements PasswordHasher {
    hash(value: string): string {
        return hashPassword(value).hashedPassword;
    }

    compare(value: string, hash: string): boolean {
        return bcrypt.compareSync(value, hash);
    }
}