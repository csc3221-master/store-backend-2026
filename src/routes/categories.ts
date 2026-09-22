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
const editable = ["name", "description"] as const;

router.get("/", async (_req, res) => {
  res.json(await query("SELECT * FROM categories ORDER BY id"));
});

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const rows = await query("SELECT * FROM categories WHERE id = $1", [id]);
  if (!rows[0]) throw new HttpError(404, "Category not found");
  res.json(rows[0]);
});

router.post("/", async (req, res) => {
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  const rows = await query(
    "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
    [requiredString(body, "name", 100), nullableString(body, "description")],
  );
  res.status(201).json(rows[0]);
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  const rows = await query(
    `UPDATE categories SET name = $1, description = $2
     WHERE id = $3 RETURNING *`,
    [
      requiredString(body, "name", 100),
      nullableString(body, "description"),
      id,
    ],
  );
  if (!rows[0]) throw new HttpError(404, "Category not found");
  res.json(rows[0]);
});

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const body = requestBody(req);
  rejectUnknownFields(body, editable);
  requireAtLeastOneField(body);
  const values: Record<string, unknown> = {};
  if ("name" in body) values.name = requiredString(body, "name", 100);
  if ("description" in body) values.description = nullableString(body, "description");

  const statement = updateSql("categories", "id", id, values);
  const rows = await query(statement.text, statement.params);
  if (!rows[0]) throw new HttpError(404, "Category not found");
  res.json(rows[0]);
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id ?? "");
  const rows = await query("DELETE FROM categories WHERE id = $1 RETURNING id", [id]);
  if (!rows[0]) throw new HttpError(404, "Category not found");
  res.status(204).send();
});

export default router;
