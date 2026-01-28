import { NewUser, User, UserRepository } from "../repository";

class AuthService {
    constructor(private readonly userRepository: UserRepository) { }

    async addCustomer(payload: NewUser): Promise<User> {
        //check user already exists or not
        const existingUser = await this.userRepository.getUserById({ id: payload.external_customer_id });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const user = await this.userRepository.createUser(payload);
        return user;
    }
}

export { AuthService };