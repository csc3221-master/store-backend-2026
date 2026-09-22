import type { ErrorRequestHandler, Request } from "express";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function parseId(value: string | string[], label = "id"): number {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new HttpError(400, `${label} must be a positive integer`);
  }
  return Number(value);
}

export function requestBody(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
  return req.body as Record<string, unknown>;
}

export function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const unknown = Object.keys(body).find((key) => !allowed.includes(key));
  if (unknown) throw new HttpError(400, `Field '${unknown}' is not editable`);
}

export function requiredString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${key} is required and must be a non-empty string`);
  }
  if (value.length > maxLength) {
    throw new HttpError(400, `${key} must be at most ${maxLength} characters`);
  }
  return value.trim();
}

export function nullableString(
  body: Record<string, unknown>,
  key: string,
  maxLength?: number,
): string | null {
  const value = body[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new HttpError(400, `${key} must be a string or null`);
  }
  if (maxLength && value.length > maxLength) {
    throw new HttpError(400, `${key} must be at most ${maxLength} characters`);
  }
  return value.trim();
}

export function positiveInteger(value: unknown, key: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new HttpError(400, `${key} must be a positive integer`);
  }
  return value;
}

export function nonNegativeInteger(value: unknown, key: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new HttpError(400, `${key} must be a non-negative integer`);
  }
  return value;
}

export function nonNegativeDecimal(value: unknown, key: string): string {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    value === "" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  ) {
    throw new HttpError(400, `${key} must be a non-negative number`);
  }
  return String(value);
}

export function timestamp(value: unknown, key: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new HttpError(400, `${key} must be a valid date/time string`);
  }
  return value;
}

export function requireAtLeastOneField(body: Record<string, unknown>): void {
  if (Object.keys(body).length === 0) {
    throw new HttpError(400, "At least one editable field is required");
  }
}

export function updateSql(
  table: string,
  idColumn: string,
  id: number,
  values: Record<string, unknown>,
): { text: string; params: unknown[] } {
  const entries = Object.entries(values);
  const assignments = entries
    .map(([column], index) => `${column} = $${index + 1}`)
    .join(", ");
  return {
    text: `UPDATE ${table} SET ${assignments} WHERE ${idColumn} = $${entries.length + 1} RETURNING *`,
    params: [...entries.map(([, value]) => value), id],
  };
}

interface DatabaseError extends Error {
  code?: string;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    res.status(400).json({ error: "Request body contains invalid JSON" });
    return;
  }

  const databaseError = error as DatabaseError;
  if (databaseError.code === "23505") {
    res.status(409).json({ error: "A record with those unique values already exists" });
    return;
  }
  if (databaseError.code === "23503") {
    res.status(409).json({ error: "The operation conflicts with related records" });
    return;
  }
  if (["23502", "23514", "22001", "22P02"].includes(databaseError.code ?? "")) {
    res.status(400).json({ error: "The supplied values violate a database constraint" });
    return;
  }

  console.error("Unexpected request error", error);
  res.status(500).json({ error: "Internal server error" });
};
