import { Request, Response } from "express";
import { posts } from "../data/posts";
import { Post } from "../models/post.model";

export const getPosts = (_req: Request, res: Response) => {
  res.json({ data: posts });
};

export const getPostById = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ data: post });
};

export const createPost = (req: Request, res: Response) => {
  const { title, body, author } = req.body ?? {};
  if (!title || !body) return res.status(400).json({ error: "title and body are required" });

  const nextId = posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;
  const newPost: Post = { id: nextId, title, body, author, createdAt: new Date().toISOString() };
  posts.push(newPost);
  res.status(201).json({ data: newPost });
};

export const deletePost = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Post not found" });
  const removed = posts.splice(idx, 1)[0];
  res.json({ data: removed });
};
