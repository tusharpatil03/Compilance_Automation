import { UnitOfWork } from "../../src/repositories/UnitOfWork";

type TxFactory = () => any;
type RepoFactory = <T>(Repo: new (tx: any) => T, tx: any) => T;

export class MockUnitOfWork implements UnitOfWork {
    private tx: any;
    private readonly txFactory: TxFactory;
    private readonly repoFactory?: RepoFactory;

    constructor(txFactory: TxFactory = () => ({}), repoFactory?: RepoFactory) {
        this.txFactory = txFactory;
        this.repoFactory = repoFactory;
    }

    async execute<T>(work: (uow: this) => Promise<T>): Promise<T> {
        this.tx = this.txFactory();
        try {
            return await work(this);
        } finally {
            this.tx = undefined;
        }
    }

    getRepository<T>(Repo: new (tx: any) => T): T {
        if (!this.tx) {
            throw new Error("UnitOfWork transaction is not active");
        }
        if (this.repoFactory) {
            return this.repoFactory(Repo, this.tx);
        }
        return new Repo(this.tx);
    }

    // For tests that need to assert on the active transaction.
    getActiveTx(): any {
        return this.tx;
    }
}