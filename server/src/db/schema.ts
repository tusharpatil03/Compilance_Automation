import { users } from "../modules/user/schema";
const schema = {
    users: users
}
export default schema;

export type AppSchema = typeof schema;