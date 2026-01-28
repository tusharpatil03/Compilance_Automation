// define routes for tenant module
import { Router } from "express";
import { validagteBody } from "../../utils/inputValidator";
import { tenantLoginSchema, tenantRegisterSchema } from "./zodSchema";
import { registerTenant } from "./controllers/register";
import { loginTenant } from "./controllers/login";

const router = Router();

/**
 * POST /tenant/register
 * Register a new tenant and receive JWT token
 */
router.post("/register", validagteBody(tenantRegisterSchema), registerTenant);

/**
 * POST /tenant/login
 * Authenticate tenant and receive JWT token
 */
router.post("/login", validagteBody(tenantLoginSchema), loginTenant);

// Future routes for API key management (to be implemented)
// router.post("/api-keys", authenticateTenant, createApiKey);
// router.get("/api-keys", authenticateTenant, listApiKeys);
// router.delete("/api-keys/:id", authenticateTenant, revokeApiKey);

export default router;
