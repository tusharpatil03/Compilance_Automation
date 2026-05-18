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

            try {
                //execute the work function with the unit of work instance
                return await work(this);
            } finally {
                this.tx = undefined;
            }
        });
    }

    getRepository<T>(Repo: new (tx: any) => T): T {
        if (!this.tx) {
            throw new Error("UnitOfWork transaction is not active");
        }
        return new Repo(this.tx)
    }
}