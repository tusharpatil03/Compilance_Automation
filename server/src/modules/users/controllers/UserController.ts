import { UserRepository } from "../repository";
import { db } from "../../../db/connection";
import { UserServices } from "../services/UserServices";
import { Request, Response } from "express"
import { NewUser } from "../schema";
import { SyncUserInput } from "../zodschema";
import { DrizzleUnitOfWork, UnitOfWork } from "../../../repositories/UnitOfWork";

export class UserController {
  public userServices: UserServices;
  private readonly repository: UserRepository;
  protected readonly uow: UnitOfWork;

  constructor() {
    this.repository = new UserRepository(db);
    this.userServices = new UserServices(db);
    this.uow = new DrizzleUnitOfWork(db);
  }

  public async syncUser(req: Request, res: Response) {
    try {
      const data:SyncUserInput = req.body;

      const tenantId = (req as any).tenant?.id;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: tenant is missing",
        });
      }

      const now = new Date().toISOString();

      //create payload for user creation
      const payload: NewUser = {
        external_customer_id: data.external_customer_id,
        name: data.name,
        email: data.email,
        tenant_id: tenantId, // enforce from auth
        phone: data.phone,
        status: "active",
        created_at: now,
        updated_at: now,
      };

      //create or update user based on external_customer_id
      const user = await this.userServices.createUser(this.uow, payload);
      return res.status(200).json({
        success: true,
        message: "User synced successfully",
        data: user,
      });
    } catch (error: any) {
      const status = error?.message?.includes("Already Exists") ? 409 : 500;
      return res.status(status).json({
        success: false,
        message: error?.message ?? "failed to sync new user",
      });
    }
  }
}