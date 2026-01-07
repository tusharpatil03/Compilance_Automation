import { NewUser, User, UserRepository } from "../repository";

class AuthService {
    constructor(private readonly userRepository: UserRepository) {}

    async registerUser(payload: NewUser) : Promise<User> {
        const user = await this.userRepository.createUser(payload);
        return user;
    }
}

export { AuthService };