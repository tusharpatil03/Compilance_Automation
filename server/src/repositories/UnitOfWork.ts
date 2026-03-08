import { DrizzleClient } from "./BaseRepository";

export interface UnitOfWork {
    execute<T>(work: (uow: this) => Promise<T>): Promise<T>;
    getRepository<T>(Repo: new (tx: any) => T): T;
}

export class DrizzleUnitOfWork implements UnitOfWork {
    private readonly db: DrizzleClient;
    private tx: any

    constructor(db: DrizzleClient) {
        this.db = db;
    }

    async execute<T>(work: (uow: this) => Promise<T>): Promise<T> {
        return this.db.transaction(async (tx) => {
            this.tx = tx;

            //execute the work function with the unit of work instance
            return await work(this);
        });
    }

    getRepository<T>(Repo: new (tx: any) => T): T {
        return new Repo(this.tx)
    }
}