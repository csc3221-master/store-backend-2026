import { Router } from "express";
import { query, transaction } from "../db.js";
import { requireAppToken } from "../middleware/auth.js";
import {
  HttpError,
  parseId,
  positiveInteger,
  rejectUnknownFields,
  requestBody,
  requireAtLeastOneField,
  timestamp,
  updateSql,
} from "../utils.js";

const router = Router();
const statuses = ["pending", "paid", "shipped", "cancelled"] as const;

function orderStatus(value: unknown): string {
  if (typeof value !== "string" || !statuses.includes(value as (typeof statuses)[number])) {
    throw new HttpError(400, `status must be one of: ${statuses.join(", ")}`);
  }
  return value;
}

async function ensureOrder(id: number): Promise<void> {
  const rows = await query("SELECT id FROM purchase_orders WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Purchase order not found");
}

router.get("/", async (_req, res) => {
  res.json(await query("SELECT * FROM purchase_orders ORDER BY id"));
});

router.get("/:po_id", async (req, res) => {
  const id = parseId(req.params.po_id ?? "", "po_id");
  const rows = await query("SELECT * FROM purchase_orders WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Purchase order not found");
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const body = requestBody(req);
  rejectUnknownFields(body, ["customer_id", "order_date", "status"]);
  const customerId = positiveInteger(body.customer_id, "customer_id");
  const orderDate = body.order_date === undefined
    ? null
    : timestamp(body.order_date, "order_date");
  const status = body.status === undefined ? "pending" : orderStatus(body.status);
  const rows = await query(
    `INSERT INTO purchase_orders (customer_id, order_date, status)
     VALUES ($1, COALESCE($2::timestamptz, CURRENT_TIMESTAMP), $3)
     RETURNING *`,
    [customerId, orderDate, status],
  );
  res.status(201).json(rows[0]);
});

router.patch("/:po_id", requireAppToken, async (req, res) => {
  const id = parseId(req.params.po_id ?? "", "po_id");
  const body = requestBody(req);
  rejectUnknownFields(body, ["customer_id", "order_date", "status"]);
  requireAtLeastOneField(body);
  const values: Record<string, unknown> = {};
  if ("customer_id" in body) {
    values.customer_id = positiveInteger(body.customer_id, "customer_id");
  }
  if ("order_date" in body) values.order_date = timestamp(body.order_date, "order_date");
  if ("status" in body) values.status = orderStatus(body.status);

  const statement = updateSql("purchase_orders", "id", id, values);
  const rows = await query(statement.text, statement.params);
  if (!rows[0]) throw new HttpError(404, "Purchase order not found");
  res.json(rows[0]);
});

router.get("/:po_id/items", async (req, res) => {
  const orderId = parseId(req.params.po_id ?? "", "po_id");
  await ensureOrder(orderId);
  res.json(
    await query(
      "SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id",
      [orderId],
    ),
  );
});

router.get("/:po_id/items/:item_id", async (req, res) => {
  const orderId = parseId(req.params.po_id ?? "", "po_id");
  const itemId = parseId(req.params.item_id ?? "", "item_id");
  await ensureOrder(orderId);
  const rows = await query(
    `SELECT * FROM purchase_order_items
     WHERE id = $1 AND purchase_order_id = $2`,
    [itemId, orderId],
  );
  if (!rows[0]) throw new HttpError(404, "Purchase order item not found");
  res.json(rows[0]);
});

router.post("/:po_id/items", async (req, res) => {
  const orderId = parseId(req.params.po_id ?? "", "po_id");
  const body = requestBody(req);
  rejectUnknownFields(body, ["product_id", "quantity"]);
  const productId = positiveInteger(body.product_id, "product_id");
  const quantity = positiveInteger(body.quantity, "quantity");
  await ensureOrder(orderId);
  const product = await query("SELECT id, price FROM products WHERE id = $1", [productId]);
  if (!product[0]) throw new HttpError(404, "Product not found");

  const results = await transaction([
    {
      text: `INSERT INTO purchase_order_items
             (purchase_order_id, product_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      params: [orderId, productId, quantity, product[0].price],
    },
    {
      text: `UPDATE purchase_orders
             SET total_amount = (
               SELECT COALESCE(SUM(quantity * unit_price), 0)
               FROM purchase_order_items
               WHERE purchase_order_id = $1
             )
             WHERE id = $1 RETURNING *`,
      params: [orderId],
    },
  ]);
  res.status(201).json(results[0]?.[0]);
});

router.delete("/:po_id/items/:item_id", async (req, res) => {
  const orderId = parseId(req.params.po_id ?? "", "po_id");
  const itemId = parseId(req.params.item_id ?? "", "item_id");
  await ensureOrder(orderId);
  const results = await transaction([
    {
      text: `DELETE FROM purchase_order_items
             WHERE id = $1 AND purchase_order_id = $2 RETURNING id`,
      params: [itemId, orderId],
    },
    {
      text: `UPDATE purchase_orders
             SET total_amount = (
               SELECT COALESCE(SUM(quantity * unit_price), 0)
               FROM purchase_order_items
               WHERE purchase_order_id = $1
             )
             WHERE id = $1 RETURNING id`,
      params: [orderId],
    },
  ]);
  if (!results[0]?.[0]) throw new HttpError(404, "Purchase order item not found");
  res.status(204).send();
});

router.post("/:po_id/receipt", async (req, res) => {
  const orderId = parseId(req.params.po_id ?? "", "po_id");
  await ensureOrder(orderId);
  const existing = await query(
    "SELECT id FROM receipts WHERE purchase_order_id = $1",
    [orderId],
  );
  if (existing[0]) throw new HttpError(409, "A receipt already exists for this purchase order");

  const results = await transaction([
    {
      text: `WITH new_receipt AS (
               INSERT INTO receipts (purchase_order_id, total_amount)
               SELECT $1, COALESCE(SUM(quantity * unit_price), 0)
               FROM purchase_order_items
               WHERE purchase_order_id = $1
               RETURNING *
             ),
             copied_items AS (
               INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price)
               SELECT nr.id, poi.product_id, poi.quantity, poi.unit_price
               FROM new_receipt nr
               JOIN purchase_order_items poi ON poi.purchase_order_id = nr.purchase_order_id
               RETURNING id
             )
             SELECT nr.*
             FROM new_receipt nr
             LEFT JOIN (SELECT COUNT(*) FROM copied_items) copied ON TRUE`,
      params: [orderId],
    },
  ]);
  res.status(201).json(results[0]?.[0]);
});

export default router;
