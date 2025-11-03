import { Request, Response } from "express";
import { orders } from "../data/orders";
import { products } from "../data/products";
import { Order, OrderItem } from "../models/order.model";
import { nextId, nowISO } from "../utils/price";

function buildItems(input: Array<{ productId: number; quantity: number }>): OrderItem[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error("items must be non-empty array");

  return input.map(({ productId, quantity }) => {
    const product = products.find(p => p.id === Number(productId));
    if (!product) throw new Error(`productId ${productId} not found`);
    if (typeof quantity !== "number" || quantity <= 0) throw new Error("quantity must be > 0");
    if (product.stock < quantity) throw new Error(`insufficient stock for productId ${productId}`);

    const unitPrice = product.price;
    const lineTotal = unitPrice * quantity;
    return { productId: product.id, quantity, unitPrice, lineTotal };
  });
}

function total(items: OrderItem[]) {
  return items.reduce((s, it) => s + it.lineTotal, 0);
}

export const listOrders = (_: Request, res: Response) => {
  res.json({ data: orders });
};

export const getOrder = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ data: order });
};

export const createOrder = (req: Request, res: Response) => {
  const { customerName, items } = req.body ?? {};
  if (!customerName) return res.status(400).json({ error: "customerName is required" });

  try {
    const built = buildItems(items);
    // reduce stock (since dummy, we mutate)
    built.forEach(i => {
      const p = products.find(p => p.id === i.productId)!;
      p.stock -= i.quantity;
    });

    const order: Order = {
      id: nextId(orders),
      customerName,
      items: built,
      total: total(built),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    orders.push(order);
    res.status(201).json({ data: order });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateOrder = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { customerName, items } = req.body ?? {};
  try {
    if (customerName !== undefined) order.customerName = customerName;
    if (items !== undefined) {
      // restore previous stock first
      order.items.forEach(i => {
        const p = products.find(p => p.id === i.productId)!;
        p.stock += i.quantity;
      });
      const built = buildItems(items);
      // deduct new stock
      built.forEach(i => {
        const p = products.find(p => p.id === i.productId)!;
        p.stock -= i.quantity;
      });
      order.items = built;
      order.total = total(built);
    }
    order.updatedAt = nowISO();
    res.json({ data: order });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteOrder = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ error: "Order not found" });

  // restore stock on delete
  orders[idx].items.forEach(i => {
    const p = products.find(p => p.id === i.productId)!;
    p.stock += i.quantity;
  });

  const removed = orders.splice(idx, 1)[0];
  res.json({ data: removed });
};
