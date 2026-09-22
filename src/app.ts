import cors from "cors";
import express from "express";
import categoriesRouter from "./routes/categories.js";
import customersRouter from "./routes/customers.js";
import productsRouter from "./routes/products.js";
import purchaseOrdersRouter from "./routes/purchaseOrders.js";
import receiptsRouter from "./routes/receipts.js";
import { errorHandler } from "./utils.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (_req, res) => {
  res.json({ name: "Store Backend 2026", status: "ok" });
});

app.use("/api/customers", customersRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/purchase_orders", purchaseOrdersRouter);
app.use("/api/receipts", receiptsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
