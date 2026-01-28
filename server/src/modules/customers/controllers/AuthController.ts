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
        const user = await this.authService.addCustomer(payload);
        res.send(user);
    }
}

export { AuthController };