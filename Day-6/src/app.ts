import express from "express";
import usersRoute from "./routes/users.route";
import postsRoute from "./routes/posts.route";
import categoriesRoute from "./routes/categories.route";
import pointsRoute from "./routes/point.route";
import authRoute from "./routes/auth.route";
import usersAvatarRoute from "./routes/users.avatar.route";
import { respondMiddleware } from "./middlewares/respond.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import { globalLimiter, authLimiter } from "./middlewares/rate-limit.middleware";
import { corsMiddleware } from "./middlewares/cors.middleware";

const app = express();
app.use(express.json());
app.use(errorMiddleware);
app.use(respondMiddleware);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(globalLimiter);
app.use(corsMiddleware);
app.use(usersAvatarRoute);

app.use("/auth", authLimiter, authRoute);
app.use("/users", usersRoute);
app.use("/posts", postsRoute);
app.use("/categories", categoriesRoute);
app.use("/", pointsRoute);

export default app;