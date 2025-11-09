import express from "express";
import productsRoute from "./routes/products.route";
import ordersRoute from "./routes/orders.route";
import ordersSummaryRoute from "./routes/order.summary.route";
import { errorMiddleware } from "./middlewares/error.middleware";
import suppliersRoute from "./routes/suppliers.route";
import { respondMiddleware } from "./middlewares/respond.middleware";
import suppliersAuthRoute from "./routes/suppliers.auth.route";
import suppliersProductsRoute from "./routes/suppliers.products.route";


const app = express();
app.use(express.json());
app.use(errorMiddleware);
app.use(respondMiddleware);

app.use(suppliersAuthRoute);
app.use(suppliersProductsRoute);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/products", productsRoute);
app.use("/orders/summary", ordersSummaryRoute);
app.use("/orders", ordersRoute);
app.use("/suppliers", suppliersRoute);         

export default app;
