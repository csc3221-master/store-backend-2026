import { Router } from "express";
import { query } from "../db.js";
import {
  HttpError,
  nonNegativeDecimal,
  nonNegativeInteger,
  nullableString,
  parseId,
  positiveInteger,
  rejectUnknownFields,
  requestBody,
  requireAtLeastOneField,
  requiredString,
  updateSql,
} from "../utils.js";

const router = Router();
const editable = ["name", "description", "price", "stock_quantity"] as const;

async function ensureProduct(id: number): Promise<void> {
  const rows = await query("SELECT id FROM products WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
}

router.get("/", async (_req, res) => {
  res.json(await query("SELECT * FROM products ORDER BY id"));
});

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const rows = await query("SELECT * FROM products WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  const rows = await query(
    `INSERT INTO products (name, description, price, stock_quantity)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      requiredString(body, "name", 200),
      nullableString(body, "description"),
      nonNegativeDecimal(body.price, "price"),
      body.stock_quantity === undefined
        ? 0
        : nonNegativeInteger(body.stock_quantity, "stock_quantity"),
    ],
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  const rows = await query(
    `UPDATE products
     SET name = $1, description = $2, price = $3, stock_quantity = $4
     WHERE id = $5 RETURNING *`,
    [
      requiredString(body, "name", 200),
      nullableString(body, "description"),
      nonNegativeDecimal(body.price, "price"),
      nonNegativeInteger(body.stock_quantity, "stock_quantity"),
      id,
    ],
  );
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  requireAtLeastOneField(body);
  const values: Record<string, unknown> = {};
  if ("name" in body) values.name = requiredString(body, "name", 200);
  if ("description" in body) values.description = nullableString(body, "description");
  if ("price" in body) values.price = nonNegativeDecimal(body.price, "price");
  if ("stock_quantity" in body) {
    values.stock_quantity = nonNegativeInteger(body.stock_quantity, "stock_quantity");
  }

  const statement = updateSql("products", "id", id, values);
  const rows = await query(statement.text, statement.params);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const rows = await query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.status(204).send();
});

router.get("/:id/purchase_orders", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  await ensureProduct(id);
  res.json(
    await query(
      `SELECT po.*
       FROM purchase_orders po
       JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       WHERE poi.product_id = $1
       ORDER BY po.id`,
      [id],
    ),
  );
});

router.get("/:id/receipts", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  await ensureProduct(id);
  res.json(
    await query(
      `SELECT r.*
       FROM receipts r
       JOIN receipt_items ri ON ri.receipt_id = r.id
       WHERE ri.product_id = $1
       ORDER BY r.id`,
      [id],
    ),
  );
});

router.get("/:product_id/categories", async (req, res) => {
  const productId = parseId(req.params.product_id ?? "", "product_id");
  await ensureProduct(productId);
  res.json(
    await query(
      `SELECT c.*
       FROM categories c
       JOIN product_categories pc ON pc.category_id = c.id
       WHERE pc.product_id = $1
       ORDER BY c.id`,
      [productId],
    ),
  );
});

router.post("/:product_id/categories", async (req, res) => {
  const productId = parseId(req.params.product_id ?? "", "product_id");
  const body = requestBody(req);
  rejectUnknownFields(body, ["category_id"]);
  const categoryId = positiveInteger(body.category_id, "category_id");
  await ensureProduct(productId);
  const category = await query("SELECT id FROM categories WHERE id = $1", [categoryId]);
  if (!category[0]) throw new HttpError(404, "Category not found");

  const rows = await query(
    `INSERT INTO product_categories (product_id, category_id)
     VALUES ($1, $2) RETURNING *`,
    [productId, categoryId],
  );
  res.status(201).json(rows[0]);
});

router.delete("/:product_id/categories/:category_id", async (req, res) => {
  const productId = parseId(req.params.product_id ?? "", "product_id");
  const categoryId = parseId(req.params.category_id ?? "", "category_id");
  await ensureProduct(productId);
  const rows = await query(
    `DELETE FROM product_categories
     WHERE product_id = $1 AND category_id = $2
     RETURNING product_id, category_id`,
    [productId, categoryId],
  );
  if (!rows[0]) throw new HttpError(404, "Product/category relationship not found");
  res.status(204).send();
});

export default router;
