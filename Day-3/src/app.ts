import express from "express";
import productsRoute from "./routes/products.route";
import ordersRoute from "./routes/orders.route";        // <-- add this
import ordersSummaryRoute from "./routes/order.summary.route";

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/products", productsRoute);
app.use("/orders/summary", ordersSummaryRoute);
app.use("/orders", ordersRoute);                        // <-- add this


export default app;
