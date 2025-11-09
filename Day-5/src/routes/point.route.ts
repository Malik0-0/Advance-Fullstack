import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { transferPoints, topUpPoints } from "../controllers/points.controller";

const router = Router();

router.post("/points/topup", authMiddleware, authorize("ADMIN"), topUpPoints);
router.post("/points/transfer", authMiddleware, authorize("USER"), transferPoints);

export default router;
