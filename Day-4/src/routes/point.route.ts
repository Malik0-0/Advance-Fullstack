import { Router } from "express";
import { transferPoints } from "../controllers/point.controller";
const router = Router();

router.post("/transfer-points", transferPoints);

export default router;