import express from "express";
import usersRoute from "./routes/users.route";
import postsRoute from "./routes/posts.route";
import categoriesRoute from "./routes/categories.route";
import pointsRoute from "./routes/point.route";
import authRoute from "./routes/auth.route";
import { respondMiddleware } from "./middlewares/respond.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();
app.use(express.json());
app.use(errorMiddleware);
app.use(respondMiddleware);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoute);
app.use("/users", usersRoute);
app.use("/posts", postsRoute);
app.use("/categories", categoriesRoute);
app.use("/", pointsRoute);

export default app;