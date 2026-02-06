import { Constructor, BaseRepository } from "./BaseRepository"

function WithPagination<TBase extends Constructor<BaseRepository<any>>>(
    Base: TBase
) {
    return class extends Base {
        async findPaginated(limit = this.defaultLimit, offset = this.defaultOffset) {
            return this.getDb()
                .select()
                .from(this.table)
                .limit(limit)
                .offset(offset)
        }
    }
}

export { WithPagination };