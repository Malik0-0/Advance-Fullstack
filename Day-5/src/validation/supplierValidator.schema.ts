import { z } from "zod";

export const SupplierRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["SUPPLIER", "ADMIN"]).optional()
});

export const SupplierLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const ProductCreateSchema = z.object({
  name: z.string().min(3, "name must be at least 3 characters"),
  price: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative()
});