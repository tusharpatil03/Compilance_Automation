import { Router } from "express";
import { UserController } from "./controllers/UserController";
import { LoginUserSchema, RegisterUserSchema } from "./zodschema";
import { validagteBody } from "./middlewares/validator";

const router = Router();
const userController = new UserController();

router.post("/register", validagteBody(RegisterUserSchema), userController.authController.register);
router.post("/login",validagteBody(LoginUserSchema), userController.authController.login.bind(userController.authController));

export default router;