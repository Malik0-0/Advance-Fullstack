import express from "express";
import productsRoute from "./routes/products.route";
import ordersRoute from "./routes/orders.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/products", productsRoute);
app.use("/orders", ordersRoute);

export default app;
