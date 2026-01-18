import { hashPasword } from "../../../utils/bcrypt";
import { NewUser, User, UserRepository } from "../repository";

class AuthService {
    constructor(private readonly userRepository: UserRepository) {}

    async registerUser(payload: NewUser) : Promise<User> {
        if(!payload.email || payload.password){
            throw new Error("Email and password are required for registration");
        }
        //check user already exists or not
        const existingUser = await this.userRepository.getUserByEmail({email: payload.email});
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const {hashedPassword, salt} = hashPasword({password:payload.password});
        payload.password = hashedPassword;
        payload.salt = salt;
        const user = await this.userRepository.createUser(payload);
        return user;
    }

    async authenticateUser(email: string, password: string): Promise<User | null> {
        if (!email || !password) {
            throw new Error("Email and password are required for authentication");
        }
        const user = await this.userRepository.getUserByEmail({ email });
        if (!user) {
            throw new Error("User not found");
        }
        const { hashedPassword } = hashPasword({ password, salt: user.salt });
        if (hashedPassword === user.password) {
            return user;
        }
        return null;
    }
}

export { AuthService };