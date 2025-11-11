import { Router } from "express";
import { listCategories, createCategory } from "../controllers/categories.controller";

const router = Router();

router.get("/", listCategories);
router.post("/", createCategory);

export default router;
