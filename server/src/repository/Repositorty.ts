// export interface IUser {
//     id: string;
//     name: string;
//     email: string;
//     createdAt: Date;
// }

import { users } from "../models/User";

// This replaces your manual 'interface IUser'
export type User = typeof users.$inferSelect;

// This is used for creating new users (automatically handles optional/default fields)
export type NewUser = typeof users.$inferInsert;


interface IQueryParameters {
    limit?: number;
    offset?: number;
}


// Make `where` optional so callers can request paginated lists without filters.
export interface IUserQueryParameters extends IQueryParameters {
    where?: { email?: string } | { id?: string };
}

export interface IUserRepository {
    listUsers(): Promise<User[]>;
    getUser(param: { where: { id: number } | { email: string } }): Promise<User | null>;
    // getUsers for paginated/filtered list
    getUsers(params: IUserQueryParameters): Promise<User[]>;
    createUser(payload: Partial<NewUser>): Promise<User>;
    updateUser(id: number, payload: Partial<NewUser>): Promise<User>;
    deleteUser(param: { where: { id?: number; email?: string } }): Promise<void>;
}