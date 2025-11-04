import express from "express";
import usersRoute from "./routes/users.route";
import postsRoute from "./routes/posts.route";

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/users", usersRoute);
app.use("/posts", postsRoute);

export default app;
