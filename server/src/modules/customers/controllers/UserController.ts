import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { UserRepository } from "../repository";
import { AuthController } from "./AuthController";
import { AuthService } from "../services/AuthService";
import { db } from "../../../db/connection";

export class UserController {
  public authController: AuthController;
  private readonly repository: UserRepository;

  constructor() {
    this.repository = new UserRepository(db);
    const authService = new AuthService(this.repository);
    this.authController = new AuthController(authService);
  }
}