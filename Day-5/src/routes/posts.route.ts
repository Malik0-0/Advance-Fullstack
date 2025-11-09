import { Router } from "express";
import {
  listPosts, getPost, createPost, updatePost, deletePost,
  listPostComments, commentsSummary
} from "../controllers/posts.controller";
import { createPostComment } from "../controllers/posts.controller";

const router = Router();

router.get("/comments-summary/all", commentsSummary); 

router.get("/", listPosts);                          
router.get("/:id", getPost);
router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.get("/:id/comments", listPostComments);        
router.post("/:id/comments", createPostComment);  

export default router;
