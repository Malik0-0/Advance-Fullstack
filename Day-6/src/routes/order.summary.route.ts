import { Router } from "express";
import { ordersSummary } from "../controllers/order.summary.controller";

const router = Router();
router.get("/", ordersSummary);
export default router;
