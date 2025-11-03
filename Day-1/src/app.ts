import express from "express";
import postsRoute from "./routes/posts.route";

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use("/posts", postsRoute);

export default app;
