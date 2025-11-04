import { Router } from "express";
import { listPosts, getPost, createPost, updatePost, deletePost } from "../controllers/posts.controller";

const router = Router();
router.get("/", listPosts);
router.get("/:id", getPost);
router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
export default router;
