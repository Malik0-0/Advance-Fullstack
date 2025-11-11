import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_GLOBAL ?? 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later." },
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_STRICT ?? 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later." },
});