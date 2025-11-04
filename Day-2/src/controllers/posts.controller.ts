import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const listPosts = async (_: Request, res: Response) => {
  const data = await prisma.post.findMany({
    orderBy: { id: "asc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  res.json({ data });
};

export const getPost = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  if (!data) return res.status(404).json({ error: "Post not found" });
  res.json({ data });
};

// Accepts { title, body, authorId }
export const createPost = async (req: Request, res: Response) => {
  const { title, body, authorId } = req.body ?? {};
  if (!title || !body || !authorId) {
    return res.status(400).json({ error: "title, body, authorId are required" });
  }
  try {
    const data = await prisma.post.create({
      data: { title, body, authorId: Number(authorId) },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ data });
  } catch (e: any) {
    // P2003 = FK violation (authorId not found)
    if (e.code === "P2003") return res.status(400).json({ error: "authorId does not exist" });
    res.status(400).json({ error: "failed to create post" });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { title, body, authorId } = req.body ?? {};
  try {
    const data = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(body !== undefined ? { body } : {}),
        ...(authorId !== undefined ? { authorId: Number(authorId) } : {}),
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.json({ data });
  } catch (e: any) {
    const msg = e.code === "P2003" ? "authorId does not exist" : "Post not found";
    res.status(e.code === "P2003" ? 400 : 404).json({ error: msg });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.post.delete({ where: { id } });
    res.json({ data });
  } catch {
    res.status(404).json({ error: "Post not found" });
  }
};
