import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { SupplierLoginSchema, SupplierRegisterSchema } from "../validation/supplierValidator.schema";
import { encrypt } from "../utils/crypto";

const SECRET = process.env.JWT_SUPPLIER_SECRET || "dev_supplier_secret";
const COOKIE_NAME = process.env.SUPPLIER_COOKIE_NAME || "supplier_token";
const COOKIE_MAX = 7 * 24 * 60 * 60 * 1000; // 7 days

export const supplierRegister = async (req: Request, res: Response) => {
  const parse = SupplierRegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, message: "Invalid input", issues: parse.error.flatten() });
  const { name, email, password, role } = parse.data;

  const exists = await prisma.supplier.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ success: false, message: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);
  const supplier = await prisma.supplier.create({
    data: { name, email, password: hash, role: role ?? "SUPPLIER" },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  return (res as any).created ? (res as any).created(supplier, "Supplier registered") : res.status(201).json({ success: true, message: "Supplier registered", data: supplier });
};

export const supplierLogin = async (req: Request, res: Response) => {
  const parse = SupplierLoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ success: false, message: "Invalid input", issues: parse.error.flatten() });

  const { email, password } = parse.data;
  const supplier = await prisma.supplier.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true, role: true }
  });
  if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });

  const ok = await bcrypt.compare(password, supplier.password);
  if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

  // create token payload
  const payload = { id: supplier.id, role: supplier.role };

  // create JWT
  const token = jwt.sign(payload, SECRET, { expiresIn: "1d" });

  // encrypted token for cookie (you already have encrypt())
  const tokenEncrypted = encrypt(token);

  // set HTTP-only cookie
  res.cookie(COOKIE_NAME, tokenEncrypted, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX,
    path: "/",
  });

  // respond with both token and supplier info
  const body = {
    token,               // plain token
    tokenEncrypted,      // encrypted token
    supplier: {
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      role: supplier.role,
    },
  };

  return (res as any).ok ? (res as any).ok(body, "Login successful") : res.json({ success: true, message: "Login successful", data: body });
};

export const supplierLogout = async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return (res as any).ok ? (res as any).ok(null, "Logged out") : res.json({ success: true, message: "Logged out" });
};