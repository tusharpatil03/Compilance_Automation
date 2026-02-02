// define routes for tenant module
import { Router } from "express";
import { validagteBody } from "../../utils/inputValidator";
import { tenanatApiKeyChangeSchema, tenantApiKeyCreateSchema, tenantLoginSchema, tenantRegisterSchema } from "./zodSchema";
import { registerTenant } from "./controllers/register";
import { loginTenant } from "./controllers/login";
import { createApiKey } from "./controllers/createApikey";
import { changeApiKeyStatus } from "./controllers/changeApiKeyStatus";
import { removeApiKey } from "./controllers/removeApiKey";
import { listApiKeys } from "./controllers/listApiKeys";
import { authenticateTenant } from "./middlewares/auth";

const router = Router();


router.post("/register", validagteBody(tenantRegisterSchema), registerTenant);

router.post("/login", validagteBody(tenantLoginSchema), loginTenant);

router.post("/api-keys", authenticateTenant, validagteBody(tenantApiKeyCreateSchema), createApiKey);
router.get("/api-keys", authenticateTenant, listApiKeys);
router.delete("/api-keys/:id", authenticateTenant, removeApiKey);
router.post("/api-keys/:id", authenticateTenant, validagteBody(tenanatApiKeyChangeSchema), changeApiKeyStatus);

export default router;