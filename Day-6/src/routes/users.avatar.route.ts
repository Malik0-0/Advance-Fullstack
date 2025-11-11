import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadAvatar } from "../middlewares/upload-avatar.middleware";
import { uploadMyAvatar, getAvatar, deleteMyAvatar } from "../controllers/user.avatar.controller";
import { uploadLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

router.post("/users/me/profile-picture", authMiddleware, uploadLimiter, uploadAvatar, uploadMyAvatar);
router.get("/users/:id/profile-picture", getAvatar);
router.delete("/users/me/profile-picture", authMiddleware, deleteMyAvatar);

export default router;