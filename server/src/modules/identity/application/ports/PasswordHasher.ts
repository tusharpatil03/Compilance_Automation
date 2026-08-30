export interface PasswordHasher {
    hash(value: string): string;
    compare(value: string, hash: string): boolean;
}
