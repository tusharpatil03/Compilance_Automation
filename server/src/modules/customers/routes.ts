import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { SyncCustomer } from "./zodschema";
import { validagteBody } from "../../utils/inputValidator";

const router = Router();
const userController = new UserController();

router.post("/sync", validagteBody(SyncCustomer), userController.authController.register);

export default router;