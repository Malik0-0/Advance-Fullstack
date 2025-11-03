import { Router } from "express";
import { getPosts, getPostById, createPost, deletePost } from "../controllers/posts.controller";

const router = Router();

router.get("/", getPosts);          // Read all
router.get("/:id", getPostById);    // Read one
router.post("/", createPost);       // Create
router.delete("/:id", deletePost);  // Delete

export default router;
