import { NewUser, User } from "../repository";
import { AuthService } from "../services/AuthService";

class AuthController {
    constructor(readonly authService: AuthService) { };

    async registerUser(payload: NewUser): Promise<User> {
        const user = await this.authService.registerUser(payload);
        return user;
    }
}

export { AuthController };