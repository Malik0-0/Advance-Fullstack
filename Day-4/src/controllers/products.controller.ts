import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const listProducts = async (req: Request, res: Response) => {
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  const minStock = req.query.minStock ? Number(req.query.minStock) : undefined;
  const maxStock = req.query.maxStock ? Number(req.query.maxStock) : undefined;

  // ---- strongly typed sort ----
  type ProductSortable = "id" | "price" | "stock" | "name" | "createdAt";

  const requestedSortBy = (req.query.sortBy as string) || "id";
  const sortKey: ProductSortable = (
    ["id", "price", "stock", "name", "createdAt"] as const
  ).includes(requestedSortBy as ProductSortable)
    ? (requestedSortBy as ProductSortable)
    : "id";

  const sortOrder = (req.query.sortOrder === "desc" ? "desc" : "asc") as "asc" | "desc";

  const orderBy: Prisma.ProductOrderByWithRelationInput = { [sortKey]: sortOrder };
  // ------------------------------

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const offset = req.query.offset ? Number(req.query.offset) : 0;

  const where: Prisma.ProductWhereInput = {};
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }
  if (minStock !== undefined || maxStock !== undefined) {
    where.stock = {
      ...(minStock !== undefined ? { gte: minStock } : {}),
      ...(maxStock !== undefined ? { lte: maxStock } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return res.paginated(
    data,
    { limit, offset, total },
    "Products fetched successfully"
  );
};

export const getProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await prisma.product.findUnique({ where: { id } });
  if (!data) return res.status(404).json({ error: "Product not found" });
  return res.ok(data, "Product fetched successfully");
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
  return res.created(data, "Product created successfully");
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
    return res.updated(data, "Product updated successfully");
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.product.delete({ where: { id } });
    return res.deleted(data, "Product deleted successfully");
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
};