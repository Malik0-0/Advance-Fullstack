import express from "express";
import usersRoute from "./routes/users.route";
import postsRoute from "./routes/posts.route";
import categoriesRoute from "./routes/categories.route";

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/users", usersRoute);
app.use("/posts", postsRoute);
app.use("/categories", categoriesRoute);

export default app;
