import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const listProducts = async (_: Request, res: Response) => {
  const data = await prisma.product.findMany({ orderBy: { id: "asc" } });
  res.json({ data });
};

export const getProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await prisma.product.findUnique({ where: { id } });
  if (!data) return res.status(404).json({ error: "Product not found" });
  res.json({ data });
};

export const createProduct = async (req: Request, res: Response) => {
  const body = req.body;

  if (Array.isArray(body)) {
    const invalid = body.find(
      (p) => !p?.name || typeof p?.price !== "number" || typeof p?.stock !== "number"
    );
    if (invalid) {
      return res
        .status(400)
        .json({ error: "Each product must have name, price(number), stock(number)" });
    }

    const result = await prisma.product.createMany({
      data: body.map((p) => ({ name: p.name, price: p.price, stock: p.stock })),
      skipDuplicates: true,
    });

    const created = await prisma.product.findMany({
      orderBy: { id: "asc" },
      take: result.count,
    });

    return res.status(201).json({ count: result.count, data: created });
  }

  const { name, price, stock } = body ?? {};
  if (!name || typeof price !== "number" || typeof stock !== "number") {
    return res.status(400).json({ error: "name, price(number), stock(number) are required" });
  }

  const data = await prisma.product.create({ data: { name, price, stock } });
  res.status(201).json({ data });
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, price, stock } = req.body ?? {};
  try {
    const data = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
      },
    });
    res.json({ data });
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.product.delete({ where: { id } });
    res.json({ data });
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
};