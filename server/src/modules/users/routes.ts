import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { SyncUser } from "./zodschema";
import { validagteBody } from "../../utils/inputValidator";
import { apiAuth } from "./middlewares/apiAuthentication";

const router = Router();
const userController = new UserController();

router.post("/sync", validagteBody(SyncUser), apiAuth, userController.syncUser.bind(userController));

export default router;