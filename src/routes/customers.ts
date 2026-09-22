import { Router } from "express";
import { query } from "../db.js";
import {
  HttpError,
  nullableString,
  parseId,
  rejectUnknownFields,
  requestBody,
  requireAtLeastOneField,
  requiredString,
  updateSql,
} from "../utils.js";

const router = Router();
const editable = ["first_name", "last_name", "email", "phone"] as const;

function email(body: Record<string, unknown>): string {
  const value = requiredString(body, "email", 255);
  if (!/^\S+@\S+\.\S+$/.test(value)) {
    throw new HttpError(400, "email must be a valid email address");
  }
  return value;
}

router.get("/", async (_req, res) => {
  res.json(await query("SELECT * FROM customers ORDER BY id"));
});

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const rows = await query("SELECT * FROM customers WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Customer not found");
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  const rows = await query(
    `INSERT INTO customers (first_name, last_name, email, phone)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      requiredString(body, "first_name", 100),
      requiredString(body, "last_name", 100),
      email(body),
      nullableString(body, "phone", 30),
    ],
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  const rows = await query(
    `UPDATE customers
     SET first_name = $1, last_name = $2, email = $3, phone = $4
     WHERE id = $5 RETURNING *`,
    [
      requiredString(body, "first_name", 100),
      requiredString(body, "last_name", 100),
      email(body),
      nullableString(body, "phone", 30),
      id,
    ],
  );
  if (!rows[0]) throw new HttpError(404, "Customer not found");
  res.json(rows[0]);
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  requireAtLeastOneField(body);

  const values: Record<string, unknown> = {};
  if ("first_name" in body) values.first_name = requiredString(body, "first_name", 100);
  if ("last_name" in body) values.last_name = requiredString(body, "last_name", 100);
  if ("email" in body) values.email = email(body);
  if ("phone" in body) values.phone = nullableString(body, "phone", 30);

  const statement = updateSql("customers", "id", id, values);
  const rows = await query(statement.text, statement.params);
  if (!rows[0]) throw new HttpError(404, "Customer not found");
  res.json(rows[0]);
});

router.get("/:id/purchase_orders", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const customer = await query("SELECT id FROM customers WHERE id = $1", [id]);
  if (!customer[0]) throw new HttpError(404, "Customer not found");
  res.json(
    await query("SELECT * FROM purchase_orders WHERE customer_id = $1 ORDER BY id", [id]),
  );
});

router.get("/:id/receipts", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const customer = await query("SELECT id FROM customers WHERE id = $1", [id]);
  if (!customer[0]) throw new HttpError(404, "Customer not found");
  res.json(
    await query(
      `SELECT r.*
       FROM receipts r
       JOIN purchase_orders po ON po.id = r.purchase_order_id
       WHERE po.customer_id = $1
       ORDER BY r.id`,
      [id],
    ),
  );
});

export default router;
