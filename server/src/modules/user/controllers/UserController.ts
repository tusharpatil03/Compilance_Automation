import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { UserRepository } from "../repository";
import { AuthService } from "../services/AuthService";
import { AuthController } from "./AuthController";
import { db } from "../../../db/connection";

export class UserController {
    
    public readonly authService: AuthService;
    public readonly authController: AuthController;
    private readonly repository: UserRepository;
    private readonly db: NodePgDatabase<any>;

    constructor(){
        this.db = db;
        this.repository = new UserRepository(db);
        this.authService = new AuthService(this.repository);
        this.authController = new AuthController(this.authService)
    }
}