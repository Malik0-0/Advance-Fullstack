import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { decrypt } from "../utils/crypto";

const SECRET =
  process.env.JWT_SUPPLIER_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev_secret_key" : (() => {
    throw new Error("SECRET must be set in production");
  })());
const COOKIE_NAME = process.env.SUPPLIER_COOKIE_NAME || "supplier_token";

export type SupplierJwt = { id: number; role: "SUPPLIER" | "ADMIN" };

export function supplierAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  let token: string | undefined;

  if (h?.startsWith("Bearer ")) {
    token = h.split(" ")[1];
  } else if (req.cookies && req.cookies[COOKIE_NAME]) {
    try {
      token = decrypt(req.cookies[COOKIE_NAME]); // decrypt back to plain JWT
    } catch {
      return res.status(401).json({ success: false, message: "Invalid cookie token" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, SECRET) as SupplierJwt;
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