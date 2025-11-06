import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal Server Error" });
}
