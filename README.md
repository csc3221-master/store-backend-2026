# Store Backend 2026

A teaching-oriented REST API for a small store. It demonstrates Express routing, PostgreSQL queries, relational resources, transactions, validation, and simple bearer-token authentication without an ORM.

## Technology stack

- Node.js, TypeScript, and Express
- PostgreSQL on Neon through `@neondatabase/serverless`
- CORS through `cors`
- Local environment loading through `dotenv`
- Vercel serverless deployment

PostgreSQL `NUMERIC` columns such as `price`, `unit_price`, and `total_amount` are returned as strings by the Neon driver. The API preserves that representation consistently to avoid loss of decimal precision.

## Installation

Requirements: Node.js 20 or newer and a Neon database initialized with [db/schema.sql](db/schema.sql) and [db/seed.sql](db/seed.sql).

```bash
npm install
```

Create `.env.local` in the project root:

```dotenv
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
APP_TOKEN=choose-a-secret-token
```

The file is ignored by Git. Never commit real credentials.

## Local development

```bash
npm run dev
```

The API is available at `http://localhost:3000/api`. Other useful commands are:

```bash
npm run typecheck
npm run build
npm start
```

`npm start` runs the already-built output.

## Authentication

Only these endpoints require authentication:

- `PATCH /api/purchase_orders/:po_id`
- `PATCH /api/receipts/:receipt_id`

Send the configured token with the Bearer scheme:

```http
Authorization: Bearer your-token
```

Missing or invalid tokens return `401`. If the server has no `APP_TOKEN`, protected routes fail safely with `500`. Tokens are never accepted in request bodies or query strings.

## Endpoints

### General

- `GET /api`

### Customers

- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `PATCH /api/customers/:id`
- `GET /api/customers/:id/purchase_orders`
- `GET /api/customers/:id/receipts`

Customers cannot be deleted.

### Products and categories

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/:id/purchase_orders`
- `GET /api/products/:id/receipts`
- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/products/:product_id/categories`
- `POST /api/products/:product_id/categories`
- `DELETE /api/products/:product_id/categories/:category_id`

Product deletion returns `409` when historical order or receipt items reference it.

### Purchase orders

- `GET /api/purchase_orders`
- `GET /api/purchase_orders/:po_id`
- `POST /api/purchase_orders`
- `PATCH /api/purchase_orders/:po_id` (authenticated)
- `GET /api/purchase_orders/:po_id/items`
- `GET /api/purchase_orders/:po_id/items/:item_id`
- `POST /api/purchase_orders/:po_id/items`
- `DELETE /api/purchase_orders/:po_id/items/:item_id`
- `POST /api/purchase_orders/:po_id/receipt`

Item creation uses the product's current price. Item changes recalculate the order total in the same transaction. Purchase orders cannot be deleted.

### Receipts

- `GET /api/receipts`
- `GET /api/receipts/:receipt_id`
- `POST /api/receipts`
- `PATCH /api/receipts/:receipt_id` (authenticated)
- `GET /api/receipts/:receipt_id/items`
- `GET /api/receipts/:receipt_id/items/:item_id`
- `POST /api/receipts/:receipt_id/items`
- `DELETE /api/receipts/:receipt_id/items/:item_id`

Receipts cannot be deleted. Creating a receipt through the purchase-order operation copies all items and their historical unit prices atomically.

## Example requests

Create a customer:

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ada","last_name":"Lovelace","email":"ada@example.com","phone":null}'
```

Create an order item (the server looks up `unit_price`):

```bash
curl -X POST http://localhost:3000/api/purchase_orders/1/items \
  -H "Content-Type: application/json" \
  -d '{"product_id":2,"quantity":3}'
```

Update an order through an authenticated route:

```bash
curl -X PATCH \
  http://localhost:3000/api/purchase_orders/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $APP_TOKEN" \
  -d '{"status":"paid"}'
```

Create a receipt from a purchase order:

```bash
curl -X POST http://localhost:3000/api/purchase_orders/1/receipt
```

Errors consistently use the shape `{"error":"message"}`.

## Vercel deployment

The Vercel function entry point is [api/index.ts](api/index.ts). It exports the Express application and does not call `app.listen()`. The rewrite in [vercel.json](vercel.json) directs nested API URLs to that function.

Set `DATABASE_URL` and `APP_TOKEN` in the Vercel project's environment variables, then deploy normally. The separate [src/server.ts](src/server.ts) entry point is only for local or traditional Node.js hosting.

CORS currently allows every origin so a separately deployed frontend can call the API. A production application should restrict `origin` to its trusted frontend domains.
