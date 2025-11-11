import rateLimit from "express-rate-limit";
import type { Request } from "express";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as any).user as { id?: number } | undefined;

    if (user?.id) {
      return `user:${user.id}`;
    }

    const xff = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
    const ip = xff ?? req.ip ?? (req.socket && req.socket.remoteAddress) ?? "unknown";

    return String(ip);
  },
});