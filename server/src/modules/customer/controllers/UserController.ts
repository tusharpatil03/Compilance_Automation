import { db } from "../../../db/connection";
import { UserServices } from "../services/UserServices";
import { Request, Response } from "express"
import { NewUser } from "../schema";
import { SyncUserInput } from "../zodschema";
import { DrizzleUnitOfWork, UnitOfWork } from "../../../repositories/UnitOfWork";
import { sendErrorResponse, sendSuccessResponse, ApiError } from "../../../utils/errorHandler";
import { ErrorCode } from "../../../utils/APIContract";

export class UserController {
  public userServices: UserServices;
  protected readonly uow: UnitOfWork;

  constructor() {
    this.userServices = new UserServices();
    this.uow = new DrizzleUnitOfWork(db);
  }

  public async syncUser(req: Request, res: Response) {
    try {
      const data:SyncUserInput = req.body;

      const tenantId = (req as any).tenant?.id;
      if (!tenantId) {
        return sendErrorResponse(
          res,
          new ApiError(
            ErrorCode.AUTH_REQUIRED,
            "Authentication required",
            401
          )
        );
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
      return sendSuccessResponse(res, 200, "User synced successfully", user);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return sendErrorResponse(res, error);
      }

      if (error?.message?.includes("Already Exists")) {
        return sendErrorResponse(
          res,
          new ApiError(ErrorCode.CONFLICT, error.message, 409)
        );
      }

      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.INTERNAL_ERROR,
          error?.message ?? "failed to sync new user",
          500
        )
      );
    }
  }
}