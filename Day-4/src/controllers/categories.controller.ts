import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const listCategories = async (_: Request, res: Response) => {
  const data = await prisma.category.findMany({ orderBy: { id: "asc" } });
  return res.ok(data, "Category listed successfully");
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, slug } = req.body ?? {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const data = await prisma.category.create({ data: { name, slug } });
    return res.created(data, "Category created successfully");
  } catch (e: any) {
    if (e.code === "P2002") return res.status(409).json({ error: "slug already exists" });
    res.status(400).json({ error: "failed to create category" });
  }
};
