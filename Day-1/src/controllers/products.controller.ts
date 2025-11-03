import { Request, Response } from "express";
import { products } from "../data/products";
import { Product } from "../models/product.model";
import { nextId, nowISO } from "../utils/price";

export const listProducts = (_: Request, res: Response) => {
  res.json({ data: products });
};

export const getProduct = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const prod = products.find(p => p.id === id);
  if (!prod) return res.status(404).json({ error: "Product not found" });
  res.json({ data: prod });
};

export const createProduct = (req: Request, res: Response) => {
  const { name, price, stock } = req.body ?? {};
  if (!name || typeof price !== "number" || typeof stock !== "number") {
    return res.status(400).json({ error: "name, price(number), stock(number) are required" });
  }
  const product: Product = {
    id: nextId(products),
    name,
    price,
    stock,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  products.push(product);
  res.status(201).json({ data: product });
};

export const updateProduct = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const prod = products.find(p => p.id === id);
  if (!prod) return res.status(404).json({ error: "Product not found" });

  const { name, price, stock } = req.body ?? {};
  if (name !== undefined) prod.name = name;
  if (price !== undefined) {
    if (typeof price !== "number") return res.status(400).json({ error: "price must be number" });
    prod.price = price;
  }
  if (stock !== undefined) {
    if (typeof stock !== "number") return res.status(400).json({ error: "stock must be number" });
    prod.stock = stock;
  }
  prod.updatedAt = nowISO();
  res.json({ data: prod });
};

export const deleteProduct = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  const removed = products.splice(idx, 1)[0];
  res.json({ data: removed });
};
