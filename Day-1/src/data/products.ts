import { Product } from "../models/product.model";

export const products: Product[] = [
  { id: 1, name: "Keyboard", price: 250000, stock: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "Mouse",    price: 150000, stock: 25, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: "Headset",  price: 450000, stock: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];
