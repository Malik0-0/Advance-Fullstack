import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, error: err.message, code: err.code });
  }
  if (err?.code === "P2025") {
    return res.status(404).json({ success: false, error: "Record not found", code: "NOT_FOUND" });
  }
  console.error(err);
  res.status(500).json({ success: false, error: "Internal Server Error" });
}