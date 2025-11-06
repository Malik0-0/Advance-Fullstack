import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// helpers
function computeTotal(items: { unitPrice: number; quantity: number }[]) {
  return items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
}

export const listOrders = async (_: Request, res: Response) => {
  const data = await prisma.order.findMany({
    orderBy: { id: "asc" },
    include: { items: { include: { product: true } } },
  });
  res.json({ data });
};

export const getOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!data) return res.status(404).json({ error: "Order not found" });
  res.json({ data });
};

export const createOrder = async (req: Request, res: Response) => {
  const { userId, items } =
    (req.body as { userId?: number; items?: Array<{ productId: number; quantity: number }> }) ?? {};

  if (typeof userId !== "number") return res.status(400).json({ error: "userId is required (number)" });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be non-empty array" });
  }

  try {
    const data = await prisma.$transaction(async (tx) => {
      // ensure user exists
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error(`User ${userId} not found`);

      // fetch products
      const ids = items.map(i => Number(i.productId));
      const prods = await tx.product.findMany({ where: { id: { in: ids } } });
      const map = new Map(prods.map(p => [p.id, p]));

      // validate + build item rows
      const itemRows = items.map(({ productId, quantity }) => {
        const p = map.get(Number(productId));
        if (!p) throw new Error(`productId ${productId} not found`);
        if (typeof quantity !== "number" || quantity <= 0) throw new Error("quantity must be > 0");
        if (p.stock < quantity) throw new Error(`insufficient stock for productId ${productId}`);
        return {
          productId: p.id,
          quantity,
          unitPrice: p.price,
          lineTotal: p.price * quantity,
        };
      });

      // decrement stock
      for (const row of itemRows) {
        await tx.product.update({
          where: { id: row.productId },
          data: { stock: { decrement: row.quantity } },
        });
      }

      // create order + items
      const total = computeTotal(itemRows);
      const order = await tx.order.create({
        data: {
          userId,        // <- use relation field that actually exists
          total,
          items: { create: itemRows },
        },
        include: { items: { include: { product: true } } },
      });

      return order;
    });

    res.status(201).json({ data });
  } catch (e: any) {
    const msg = e?.message || "Failed to create order";
    const status = /insufficient stock/i.test(msg) ? 409 : /not found/i.test(msg) ? 404 : 400;
    res.status(status).json({ error: msg });
  }
};


export const updateOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { userId, items } =
    (req.body as { userId?: number; items?: Array<{ productId: number; quantity: number }> }) ?? {};

  try {
    const data = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) throw new Error("Order not found");

      // restore stock from previous items
      for (const it of existing.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } },
        });
      }

      let updateData: Prisma.OrderUpdateInput = {};

      // optionally move the order to another user
      if (typeof userId === "number") {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error(`User ${userId} not found`);
        updateData.user = { connect: { id: userId } };
      }

      if (items !== undefined) {
        // validate + build new rows
        const ids = items.map(i => Number(i.productId));
        const prods = await tx.product.findMany({ where: { id: { in: ids } } });
        const map = new Map(prods.map(p => [p.id, p]));
        const rows = items.map(({ productId, quantity }) => {
          const p = map.get(Number(productId));
          if (!p) throw new Error(`productId ${productId} not found`);
          if (quantity <= 0) throw new Error("quantity must be > 0");
          if (p.stock < quantity) throw new Error(`insufficient stock for productId ${productId}`);
          return {
            productId: p.id,
            quantity,
            unitPrice: p.price,
            lineTotal: p.price * quantity,
          };
        });

        // deduct new stock
        for (const row of rows) {
          await tx.product.update({
            where: { id: row.productId },
            data: { stock: { decrement: row.quantity } },
          });
        }

        // replace items
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        updateData = {
          ...updateData,
          total: computeTotal(rows),
          items: { create: rows },
        };
      }

      const updated = await tx.order.update({
        where: { id },
        data: updateData,
        include: { items: { include: { product: true } } },
      });
      return updated;
    });

    res.json({ data });
  } catch (e: any) {
    const msg = e?.message || "Failed to update order";
    const status = /not found/i.test(msg) ? 404 : /insufficient stock/i.test(msg) ? 409 : 400;
    res.status(status).json({ error: msg });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = await prisma.$transaction(async (tx) => {
      const exists = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!exists) throw new Error("Order not found");

      // restore stock
      for (const it of exists.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } },
        });
      }

      // delete order (OrderItem has onDelete: Cascade)
      return await tx.order.delete({
        where: { id },
        include: { items: true },
      });
    });

    res.json({ data });
  } catch (e: any) {
    const msg = e?.message || "Failed to delete order";
    const status = /not found/i.test(msg) ? 404 : 400;
    res.status(status).json({ error: msg });
  }
};
