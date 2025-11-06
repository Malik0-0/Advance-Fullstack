import { Router } from "express";
import {
  listPosts, getPost, createPost, updatePost, deletePost,
  listPostComments, commentsSummary
} from "../controllers/posts.controller";
import { createPostComment } from "../controllers/posts.controller";

const router = Router();

router.get("/comments-summary/all", commentsSummary); // grouping summary

router.get("/", listPosts);                           // filtering by category
router.get("/:id", getPost);
router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.get("/:id/comments", listPostComments);        // pagination
router.post("/:id/comments", createPostComment);  // create

export default router;
