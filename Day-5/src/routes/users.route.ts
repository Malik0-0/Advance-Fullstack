import { Router } from "express";
import { listUsers, getUser, updateUser, deleteUser } from "../controllers/users.controller";

const router = Router();
router.get("/", listUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
export default router;
