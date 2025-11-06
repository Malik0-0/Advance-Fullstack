import { Router } from "express";
import { batchUpdateStock } from "../controllers/suppliers.controller";

const router = Router();
router.post("/stock", batchUpdateStock);

export default router;
