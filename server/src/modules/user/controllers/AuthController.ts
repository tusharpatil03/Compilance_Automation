import { NewUser} from "../repository";
import {Request, Response} from 'express';
import { AuthService } from "../services/AuthService";

class AuthController {
    private authService:AuthService;
    constructor(authService:AuthService){
        this.authService = authService;
    }
    
    async register(req:Request, res:Response): Promise<void> {
        const payload: NewUser = req.body;
        const user = await this.authService.registerUser(payload);
        res.send(user);
    }

    async login(req: Request, res: Response): Promise<void>{
        const {email, password} = req.body;
        const user = await this.authService.authenticateUser(email, password);
        if(!user){
            throw new Error("Invalid email or password");
        }
        res.send("hello");
    }
}

export { AuthController };