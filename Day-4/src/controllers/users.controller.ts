import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const listUsers = async (_: Request, res: Response) => {
  const data = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return res.ok(data, "User listed successfully");
};

export const getUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await prisma.user.findUnique({
    where: { id },
    include: { posts: true },
  });
  if (!data) return res.status(404).json({ error: "User not found" });
  return res.ok(data, "User showed successfully");
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email } = req.body ?? {};
  if (!name || !email) return res.status(400).json({ error: "name and email are required" });
  try {
    const data = await prisma.user.create({ data: { name, email } });
    return res.created(data, "User created successfully");
  } catch (e: any) {
    if (e.code === "P2002") return res.status(409).json({ error: "email already exists" });
    res.status(400).json({ error: "failed to create user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, email, points } = req.body ?? {};
  try {
    const data = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(points !== undefined ? { points } : {}),
      },
    });
    return res.updated(data, "User updated successfully");
  } catch {
    res.status(404).json({ error: "User not found" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.user.delete({ where: { id } });
    return res.deleted(data, "User deleted successfully");
  } catch {
    res.status(404).json({ error: "User not found" });
  }
};
