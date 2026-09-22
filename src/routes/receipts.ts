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

async function ensureReceipt(id: number): Promise<void> {
  const rows = await query("SELECT id FROM receipts WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Receipt not found");
}

router.get("/", async (_req, res) => {
  res.json(await query("SELECT * FROM receipts ORDER BY id"));
});

router.get("/:receipt_id", async (req, res) => {
  const id = parseId(req.params.receipt_id ?? "", "receipt_id");
  const rows = await query("SELECT * FROM receipts WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Receipt not found");
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const body = requestBody(req);
  rejectUnknownFields(body, ["purchase_order_id", "receipt_date"]);
  const orderId = positiveInteger(body.purchase_order_id, "purchase_order_id");
  const receiptDate = body.receipt_date === undefined
    ? null
    : timestamp(body.receipt_date, "receipt_date");
  const order = await query("SELECT id FROM purchase_orders WHERE id = $1", [orderId]);
  if (!order[0]) throw new HttpError(404, "Purchase order not found");

  const rows = await query(
    `INSERT INTO receipts (purchase_order_id, receipt_date, total_amount)
     VALUES ($1, COALESCE($2::timestamptz, CURRENT_TIMESTAMP), 0)
     RETURNING *`,
    [orderId, receiptDate],
  );
  res.status(201).json(rows[0]);
});

router.patch("/:receipt_id", requireAppToken, async (req, res) => {
  const id = parseId(req.params.receipt_id ?? "", "receipt_id");
  const body = requestBody(req);
  rejectUnknownFields(body, ["receipt_date"]);
  requireAtLeastOneField(body);
  const statement = updateSql("receipts", "id", id, {
    receipt_date: timestamp(body.receipt_date, "receipt_date"),
  });
  const rows = await query(statement.text, statement.params);
  if (!rows[0]) throw new HttpError(404, "Receipt not found");
  res.json(rows[0]);
});

router.get("/:receipt_id/items", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id ?? "", "receipt_id");
  await ensureReceipt(receiptId);
  res.json(
    await query(
      "SELECT * FROM receipt_items WHERE receipt_id = $1 ORDER BY id",
      [receiptId],
    ),
  );
});

router.get("/:receipt_id/items/:item_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id ?? "", "receipt_id");
  const itemId = parseId(req.params.item_id ?? "", "item_id");
  await ensureReceipt(receiptId);
  const rows = await query(
    "SELECT * FROM receipt_items WHERE id = $1 AND receipt_id = $2",
    [itemId, receiptId],
  );
  if (!rows[0]) throw new HttpError(404, "Receipt item not found");
  res.json(rows[0]);
});

router.post("/:receipt_id/items", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id ?? "", "receipt_id");
  const body = requestBody(req);
  rejectUnknownFields(body, ["product_id", "quantity"]);
  const productId = positiveInteger(body.product_id, "product_id");
  const quantity = positiveInteger(body.quantity, "quantity");
  await ensureReceipt(receiptId);
  const product = await query("SELECT id, price FROM products WHERE id = $1", [productId]);
  if (!product[0]) throw new HttpError(404, "Product not found");

  const results = await transaction([
    {
      text: `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      params: [receiptId, productId, quantity, product[0].price],
    },
    {
      text: `UPDATE receipts
             SET total_amount = (
               SELECT COALESCE(SUM(quantity * unit_price), 0)
               FROM receipt_items
               WHERE receipt_id = $1
             )
             WHERE id = $1 RETURNING *`,
      params: [receiptId],
    },
  ]);
  res.status(201).json(results[0]?.[0]);
});

router.delete("/:receipt_id/items/:item_id", async (req, res) => {
  const receiptId = parseId(req.params.receipt_id ?? "", "receipt_id");
  const itemId = parseId(req.params.item_id ?? "", "item_id");
  await ensureReceipt(receiptId);
  const results = await transaction([
    {
      text: `DELETE FROM receipt_items
             WHERE id = $1 AND receipt_id = $2 RETURNING id`,
      params: [itemId, receiptId],
    },
    {
      text: `UPDATE receipts
             SET total_amount = (
               SELECT COALESCE(SUM(quantity * unit_price), 0)
               FROM receipt_items
               WHERE receipt_id = $1
             )
             WHERE id = $1 RETURNING id`,
      params: [receiptId],
    },
  ]);
  if (!results[0]?.[0]) throw new HttpError(404, "Receipt item not found");
  res.status(204).send();
});

export default router;
