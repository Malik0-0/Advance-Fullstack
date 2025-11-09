import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { SupplierLoginSchema, SupplierRegisterSchema } from "../validation/supplierValidator.schema";
import { encrypt } from "../utils/crypto";

const SECRET = process.env.JWT_SUPPLIER_SECRET || "dev_supplier_secret";

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

  return res.created(supplier, "Supplier registered");
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

  const token = jwt.sign({ id: supplier.id, role: supplier.role }, SECRET, { expiresIn: "1d" });
  const tokenEncrypted = encrypt(token);

  return res.ok(
    { token, tokenEncrypted, supplier: { id: supplier.id, name: supplier.name, email: supplier.email, role: supplier.role } },
    "Login successful"
  );
};