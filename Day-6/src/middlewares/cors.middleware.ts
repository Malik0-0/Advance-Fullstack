import cors, { CorsOptions } from "cors";

const allowed = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const options: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);

    if (allowed.length === 0) return callback(null, true);

    if (allowed.includes(origin)) return callback(null, true);

    // reject other origins
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  exposedHeaders: ["Content-Length", "X-Request-Id"]
};

export const corsMiddleware = cors(options);
export default corsMiddleware;
