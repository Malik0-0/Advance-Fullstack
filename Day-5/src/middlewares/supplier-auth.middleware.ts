import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET =
  process.env.SECRET ||
  (process.env.NODE_ENV === "development" ? "dev_secret_key" : (() => {
    throw new Error("SECRET must be set in production");
  })());

export type SupplierJwt = { id: number; role: "SUPPLIER" | "ADMIN" };

export function supplierAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Missing token" });
  try {
    const payload = jwt.verify(h.split(" ")[1], SECRET) as SupplierJwt;
    (req as any).supplier = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export function allowRoles(...roles: Array<"SUPPLIER" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sup = (req as any).supplier as SupplierJwt | undefined;
    if (!sup || !roles.includes(sup.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}