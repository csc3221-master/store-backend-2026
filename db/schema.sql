-- ============================================================
-- Store Backend 2026
-- Database Schema
-- PostgreSQL / Neon
-- ============================================================


-- ------------------------------------------------------------
-- Customers
-- ------------------------------------------------------------

CREATE TABLE customers (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------

CREATE TABLE products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    description TEXT,

    price NUMERIC(10, 2) NOT NULL
        CHECK (price >= 0),

    stock_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (stock_quantity >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------

CREATE TABLE categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);


-- ------------------------------------------------------------
-- Product Categories
--
-- Implements the many-to-many relationship:
--
-- products N <----> M categories
-- ------------------------------------------------------------

CREATE TABLE product_categories (
    product_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,

    PRIMARY KEY (product_id, category_id),

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- Purchase Orders
-- ------------------------------------------------------------

CREATE TABLE purchase_orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    customer_id INTEGER NOT NULL,

    order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'paid',
                'shipped',
                'cancelled'
            )
        ),

    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
);


-- ------------------------------------------------------------
-- Purchase Order Items
--
-- Associative entity between purchase_orders and products.
-- ------------------------------------------------------------

CREATE TABLE purchase_order_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    purchase_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(10, 2) NOT NULL
        CHECK (unit_price >= 0),

    FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    UNIQUE (purchase_order_id, product_id)
);


-- ------------------------------------------------------------
-- Receipts
--
-- A receipt belongs to one purchase order.
-- A purchase order can have at most one receipt.
-- ------------------------------------------------------------

CREATE TABLE receipts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    purchase_order_id INTEGER NOT NULL UNIQUE,

    receipt_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    total_amount NUMERIC(10, 2) NOT NULL
        CHECK (total_amount >= 0),

    FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_orders(id)
        ON DELETE RESTRICT
);


-- ------------------------------------------------------------
-- Receipt Items
-- ------------------------------------------------------------

CREATE TABLE receipt_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    receipt_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(10, 2) NOT NULL
        CHECK (unit_price >= 0),

    FOREIGN KEY (receipt_id)
        REFERENCES receipts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    UNIQUE (receipt_id, product_id)
);