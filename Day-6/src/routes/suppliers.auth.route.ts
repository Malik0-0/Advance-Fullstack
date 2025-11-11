import { Router } from "express";
import { supplierLogin, supplierRegister } from "../controllers/suppliers-auth.controller";
import { strictRateLimiter } from "../middlewares/rate-limit.middleware";
const router = Router();
router.post("/suppliers/register", strictRateLimiter, supplierRegister);
router.post("/suppliers/login", strictRateLimiter, supplierLogin);
export default router;