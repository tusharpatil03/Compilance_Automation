import { users } from "../models/User";
const schema = {
    users: users
}
export default schema;

export type AppSchema = typeof schema;