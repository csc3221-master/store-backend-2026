-- ============================================================
-- Store Backend 2026
-- Seed Data
-- PostgreSQL / Neon
--
-- WARNING:
-- This file resets the seeded tables and is intended for
-- development/demo use.
-- ============================================================

BEGIN;

TRUNCATE TABLE
    receipt_items,
    receipts,
    purchase_order_items,
    purchase_orders,
    product_categories,
    products,
    categories,
    customers
RESTART IDENTITY CASCADE;

-- ------------------------------------------------------------
-- Customers
-- Famous computer scientists / computing pioneers
-- ------------------------------------------------------------

INSERT INTO customers (first_name, last_name, email, phone) VALUES
('Alan', 'Turing', 'alan.turing@example.com', '206-555-0101'),
('Grace', 'Hopper', 'grace.hopper@example.com', '206-555-0102'),
('Edsger', 'Dijkstra', 'edsger.dijkstra@example.com', '206-555-0103'),
('Donald', 'Knuth', 'donald.knuth@example.com', '206-555-0104'),
('Barbara', 'Liskov', 'barbara.liskov@example.com', '206-555-0105'),
('John', 'McCarthy', 'john.mccarthy@example.com', '206-555-0106'),
('Margaret', 'Hamilton', 'margaret.hamilton@example.com', '206-555-0107'),
('Tim', 'Berners-Lee', 'tim.bernerslee@example.com', '206-555-0108'),
('Ada', 'Lovelace', 'ada.lovelace@example.com', '206-555-0109'),
('Claude', 'Shannon', 'claude.shannon@example.com', '206-555-0110');

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------

INSERT INTO categories (name, description) VALUES
('Keyboards', 'Mechanical and membrane keyboards for desktop use'),
('Mice', 'Wired and wireless pointing devices'),
('Monitors', 'Computer displays for office, development, and gaming'),
('Storage', 'External drives, SSDs, and portable storage devices'),
('Networking', 'Routers, switches, adapters, and networking accessories'),
('Audio', 'Headphones, microphones, speakers, and related audio gear'),
('Webcams', 'USB webcams and video conferencing cameras'),
('Accessories', 'General computer accessories and desk peripherals'),
('Books', 'Programming, algorithms, and computer science books'),
('Development Boards', 'Microcontrollers and educational development boards');

-- ------------------------------------------------------------
-- Products
-- 20 per category = 200 products total
-- ------------------------------------------------------------

-- Keyboards (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    'Mechanical Keyboard K' || LPAD(gs::text, 2, '0'),
    'USB mechanical keyboard model K' || LPAD(gs::text, 2, '0') ||
    ' with programmable function keys',
    ROUND((49.99 + gs * 3.25)::numeric, 2),
    20 + (gs * 3) % 45
FROM generate_series(1, 20) AS gs;

-- Mice (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    'Wireless Mouse M' || LPAD(gs::text, 2, '0'),
    'Ergonomic wireless mouse model M' || LPAD(gs::text, 2, '0'),
    ROUND((19.99 + gs * 1.75)::numeric, 2),
    25 + (gs * 4) % 55
FROM generate_series(1, 20) AS gs;

-- Monitors (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    'Developer Monitor ' || (21 + ((gs - 1) % 7)) || ' inch D' || LPAD(gs::text, 2, '0'),
    'IPS monitor intended for software development and office work',
    ROUND((129.99 + gs * 14.50)::numeric, 2),
    8 + (gs * 2) % 20
FROM generate_series(1, 20) AS gs;

-- Storage (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    CASE
        WHEN gs <= 10 THEN 'Portable SSD ' || (250 * gs) || 'GB'
        ELSE 'External HDD ' || (gs - 9) || 'TB'
    END,
    CASE
        WHEN gs <= 10 THEN 'USB-C portable solid-state drive'
        ELSE 'USB 3 external hard disk drive for backup and archival storage'
    END,
    ROUND((44.99 + gs * 9.25)::numeric, 2),
    12 + (gs * 5) % 30
FROM generate_series(1, 20) AS gs;

-- Networking (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    CASE
        WHEN gs <= 7 THEN 'Wi-Fi Router R' || LPAD(gs::text, 2, '0')
        WHEN gs <= 14 THEN 'Gigabit Switch S' || LPAD((gs - 7)::text, 2, '0')
        ELSE 'USB Network Adapter A' || LPAD((gs - 14)::text, 2, '0')
    END,
    'Networking device for home, classroom, or small office use',
    ROUND((29.99 + gs * 6.40)::numeric, 2),
    15 + (gs * 3) % 35
FROM generate_series(1, 20) AS gs;

-- Audio (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    CASE
        WHEN gs <= 8 THEN 'USB Headset H' || LPAD(gs::text, 2, '0')
        WHEN gs <= 14 THEN 'Desktop Microphone MIC' || LPAD((gs - 8)::text, 2, '0')
        ELSE 'Stereo Speakers SP' || LPAD((gs - 14)::text, 2, '0')
    END,
    'Audio peripheral suitable for conferencing, media, and development work',
    ROUND((24.99 + gs * 4.10)::numeric, 2),
    18 + (gs * 6) % 40
FROM generate_series(1, 20) AS gs;

-- Webcams (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    'USB Webcam W' || LPAD(gs::text, 2, '0'),
    CASE
        WHEN gs <= 10 THEN '1080p USB webcam with integrated microphone'
        ELSE '4K USB webcam with autofocus and privacy shutter'
    END,
    ROUND((34.99 + gs * 5.20)::numeric, 2),
    10 + (gs * 4) % 30
FROM generate_series(1, 20) AS gs;

-- Accessories (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    CASE
        WHEN gs <= 4 THEN 'USB-C Hub ' || gs || '-Port'
        WHEN gs <= 8 THEN 'Laptop Stand LS' || LPAD((gs - 4)::text, 2, '0')
        WHEN gs <= 12 THEN 'Desk Mat DM' || LPAD((gs - 8)::text, 2, '0')
        WHEN gs <= 16 THEN 'Cable Organizer CO' || LPAD((gs - 12)::text, 2, '0')
        ELSE 'USB-C Charger ' || (45 + ((gs - 17) * 20)) || 'W'
    END,
    'General desktop and laptop accessory',
    ROUND((14.99 + gs * 3.15)::numeric, 2),
    30 + (gs * 7) % 60
FROM generate_series(1, 20) AS gs;

-- Books (20)
INSERT INTO products (name, description, price, stock_quantity) VALUES
('Introduction to Algorithms', 'Algorithms and data structures reference text', 99.95, 18),
('The Art of Computer Programming, Vol. 1', 'Fundamental algorithms and mathematical foundations', 79.99, 12),
('The Art of Computer Programming, Vol. 2', 'Seminumerical algorithms', 79.99, 10),
('The Art of Computer Programming, Vol. 3', 'Sorting and searching', 79.99, 11),
('Structure and Interpretation of Computer Programs', 'Classic text on programming abstractions', 54.95, 20),
('Computer Networks', 'Foundations of computer networking', 89.95, 16),
('Operating System Concepts', 'Operating system principles and design', 94.95, 14),
('Database System Concepts', 'Relational database theory and SQL concepts', 89.95, 17),
('Compilers: Principles, Techniques, and Tools', 'Compiler design and language processing', 92.50, 9),
('Programming Language Pragmatics', 'Programming language concepts and implementation', 84.95, 13),
('Artificial Intelligence: A Modern Approach', 'Broad introduction to artificial intelligence', 109.95, 15),
('Computer Organization and Design', 'Computer architecture and organization', 91.95, 19),
('Clean Code', 'Software craftsmanship and maintainable code', 42.99, 28),
('Design Patterns', 'Reusable object-oriented software design patterns', 54.99, 23),
('Code Complete', 'Practical software construction techniques', 49.99, 21),
('The Pragmatic Programmer', 'Practical approaches to software development', 47.99, 26),
('Modern Operating Systems', 'Operating system architecture and concepts', 96.95, 12),
('Discrete Mathematics and Its Applications', 'Discrete mathematics for computer science', 104.95, 14),
('Computer Security: Principles and Practice', 'Principles of secure systems and applications', 97.95, 10),
('Distributed Systems', 'Concepts and design of distributed systems', 88.95, 13);

-- Development Boards (20)
INSERT INTO products (name, description, price, stock_quantity)
SELECT
    CASE
        WHEN gs <= 5 THEN 'Arduino-Compatible Board A' || LPAD(gs::text, 2, '0')
        WHEN gs <= 10 THEN 'ESP32 Development Board E' || LPAD((gs - 5)::text, 2, '0')
        WHEN gs <= 15 THEN 'Raspberry Pi Pico Kit P' || LPAD((gs - 10)::text, 2, '0')
        ELSE 'Sensor Starter Kit S' || LPAD((gs - 15)::text, 2, '0')
    END,
    'Educational development board or embedded systems starter kit',
    ROUND((12.99 + gs * 4.35)::numeric, 2),
    20 + (gs * 5) % 45
FROM generate_series(1, 20) AS gs;

-- ------------------------------------------------------------
-- Product / Category relationships
-- Each product belongs to its primary category.
-- A few products also belong to Accessories where appropriate.
-- ------------------------------------------------------------

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
JOIN categories c ON
    (p.name LIKE 'Mechanical Keyboard%' AND c.name = 'Keyboards')
 OR (p.name LIKE 'Wireless Mouse%' AND c.name = 'Mice')
 OR (p.name LIKE 'Developer Monitor%' AND c.name = 'Monitors')
 OR ((p.name LIKE 'Portable SSD%' OR p.name LIKE 'External HDD%') AND c.name = 'Storage')
 OR ((p.name LIKE 'Wi-Fi Router%' OR p.name LIKE 'Gigabit Switch%' OR p.name LIKE 'USB Network Adapter%') AND c.name = 'Networking')
 OR ((p.name LIKE 'USB Headset%' OR p.name LIKE 'Desktop Microphone%' OR p.name LIKE 'Stereo Speakers%') AND c.name = 'Audio')
 OR (p.name LIKE 'USB Webcam%' AND c.name = 'Webcams')
 OR ((p.name LIKE 'USB-C Hub%' OR p.name LIKE 'Laptop Stand%' OR p.name LIKE 'Desk Mat%' OR
      p.name LIKE 'Cable Organizer%' OR p.name LIKE 'USB-C Charger%') AND c.name = 'Accessories')
 OR (p.name IN (
      'Introduction to Algorithms',
      'The Art of Computer Programming, Vol. 1',
      'The Art of Computer Programming, Vol. 2',
      'The Art of Computer Programming, Vol. 3',
      'Structure and Interpretation of Computer Programs',
      'Computer Networks',
      'Operating System Concepts',
      'Database System Concepts',
      'Compilers: Principles, Techniques, and Tools',
      'Programming Language Pragmatics',
      'Artificial Intelligence: A Modern Approach',
      'Computer Organization and Design',
      'Clean Code',
      'Design Patterns',
      'Code Complete',
      'The Pragmatic Programmer',
      'Modern Operating Systems',
      'Discrete Mathematics and Its Applications',
      'Computer Security: Principles and Practice',
      'Distributed Systems'
    ) AND c.name = 'Books')
 OR ((p.name LIKE 'Arduino-Compatible Board%' OR p.name LIKE 'ESP32 Development Board%' OR
      p.name LIKE 'Raspberry Pi Pico Kit%' OR p.name LIKE 'Sensor Starter Kit%')
      AND c.name = 'Development Boards');

-- Demonstrate genuine many-to-many classification:
-- some products also belong to Accessories.
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id
FROM products p
CROSS JOIN categories c
WHERE c.name = 'Accessories'
  AND (
       p.name LIKE 'Wireless Mouse M01'
    OR p.name LIKE 'Wireless Mouse M02'
    OR p.name LIKE 'USB Webcam W01'
    OR p.name LIKE 'USB Webcam W02'
    OR p.name LIKE 'USB Network Adapter A01'
    OR p.name LIKE 'USB Network Adapter A02'
  )
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Purchase Orders
-- Mix of pending, paid, shipped, and cancelled orders.
-- Totals are populated after inserting line items.
-- ------------------------------------------------------------

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-01 10:15:00-07', 'shipped', 0
FROM customers WHERE email = 'alan.turing@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-02 14:40:00-07', 'paid', 0
FROM customers WHERE email = 'grace.hopper@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-03 09:05:00-07', 'pending', 0
FROM customers WHERE email = 'edsger.dijkstra@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-04 16:20:00-07', 'shipped', 0
FROM customers WHERE email = 'donald.knuth@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-05 11:30:00-07', 'cancelled', 0
FROM customers WHERE email = 'barbara.liskov@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-06 13:10:00-07', 'paid', 0
FROM customers WHERE email = 'john.mccarthy@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-07 08:45:00-07', 'shipped', 0
FROM customers WHERE email = 'margaret.hamilton@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-08 15:25:00-07', 'pending', 0
FROM customers WHERE email = 'tim.bernerslee@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-09 10:55:00-07', 'paid', 0
FROM customers WHERE email = 'ada.lovelace@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-10 12:00:00-07', 'shipped', 0
FROM customers WHERE email = 'claude.shannon@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-12 17:10:00-07', 'paid', 0
FROM customers WHERE email = 'grace.hopper@example.com';

INSERT INTO purchase_orders (customer_id, order_date, status, total_amount)
SELECT id, '2026-09-15 09:35:00-07', 'pending', 0
FROM customers WHERE email = 'alan.turing@example.com';

-- ------------------------------------------------------------
-- Purchase Order Items
-- Prices are copied from the product at order time.
-- ------------------------------------------------------------

-- Order 1: Alan Turing - keyboard, mouse, algorithms book
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Mechanical Keyboard K03', 1),
    ('Wireless Mouse M05', 1),
    ('Introduction to Algorithms', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'alan.turing@example.com'
  AND po.order_date = '2026-09-01 10:15:00-07';

-- Order 2: Grace Hopper - monitor, webcam, headset
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Developer Monitor 24 inch D04', 2),
    ('USB Webcam W03', 1),
    ('USB Headset H02', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'grace.hopper@example.com'
  AND po.order_date = '2026-09-02 14:40:00-07';

-- Order 3: Edsger Dijkstra - books
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Structure and Interpretation of Computer Programs', 1),
    ('Programming Language Pragmatics', 1),
    ('Discrete Mathematics and Its Applications', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'edsger.dijkstra@example.com'
  AND po.order_date = '2026-09-03 09:05:00-07';

-- Order 4: Donald Knuth - books and storage
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('The Art of Computer Programming, Vol. 1', 1),
    ('The Art of Computer Programming, Vol. 2', 1),
    ('The Art of Computer Programming, Vol. 3', 1),
    ('Portable SSD 1000GB', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'donald.knuth@example.com'
  AND po.order_date = '2026-09-04 16:20:00-07';

-- Order 5: Barbara Liskov - cancelled order
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Developer Monitor 27 inch D07', 1),
    ('Mechanical Keyboard K08', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'barbara.liskov@example.com'
  AND po.order_date = '2026-09-05 11:30:00-07';

-- Order 6: John McCarthy - AI book + dev boards
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Artificial Intelligence: A Modern Approach', 1),
    ('ESP32 Development Board E02', 2),
    ('Sensor Starter Kit S01', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'john.mccarthy@example.com'
  AND po.order_date = '2026-09-06 13:10:00-07';

-- Order 7: Margaret Hamilton - embedded systems equipment
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Arduino-Compatible Board A03', 3),
    ('Sensor Starter Kit S03', 2),
    ('USB-C Hub 4-Port', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'margaret.hamilton@example.com'
  AND po.order_date = '2026-09-07 08:45:00-07';

-- Order 8: Tim Berners-Lee - networking
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Wi-Fi Router R03', 1),
    ('Gigabit Switch S02', 2),
    ('USB Network Adapter A01', 2)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'tim.bernerslee@example.com'
  AND po.order_date = '2026-09-08 15:25:00-07';

-- Order 9: Ada Lovelace - development setup
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Mechanical Keyboard K01', 1),
    ('Developer Monitor 22 inch D01', 1),
    ('The Pragmatic Programmer', 1),
    ('Raspberry Pi Pico Kit P02', 2)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'ada.lovelace@example.com'
  AND po.order_date = '2026-09-09 10:55:00-07';

-- Order 10: Claude Shannon - networking + storage
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Gigabit Switch S04', 1),
    ('Portable SSD 500GB', 2),
    ('Computer Networks', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'claude.shannon@example.com'
  AND po.order_date = '2026-09-10 12:00:00-07';

-- Order 11: Grace Hopper - second order
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Compilers: Principles, Techniques, and Tools', 1),
    ('Desktop Microphone MIC02', 1),
    ('USB-C Charger 65W', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'grace.hopper@example.com'
  AND po.order_date = '2026-09-12 17:10:00-07';

-- Order 12: Alan Turing - pending office upgrade
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
SELECT po.id, p.id, v.quantity, p.price
FROM purchase_orders po
JOIN customers c ON c.id = po.customer_id
JOIN (VALUES
    ('Developer Monitor 25 inch D11', 1),
    ('USB Webcam W12', 1),
    ('Clean Code', 1)
) AS v(product_name, quantity) ON TRUE
JOIN products p ON p.name = v.product_name
WHERE c.email = 'alan.turing@example.com'
  AND po.order_date = '2026-09-15 09:35:00-07';

-- Populate purchase order totals from their line items.
UPDATE purchase_orders po
SET total_amount = totals.total
FROM (
    SELECT purchase_order_id,
           ROUND(SUM(quantity * unit_price), 2) AS total
    FROM purchase_order_items
    GROUP BY purchase_order_id
) AS totals
WHERE po.id = totals.purchase_order_id;

-- ------------------------------------------------------------
-- Receipts
-- Only paid/shipped orders receive receipts.
-- Pending and cancelled orders intentionally do not.
-- ------------------------------------------------------------

INSERT INTO receipts (purchase_order_id, receipt_date, total_amount)
SELECT
    po.id,
    po.order_date + INTERVAL '1 hour',
    po.total_amount
FROM purchase_orders po
WHERE po.status IN ('paid', 'shipped');

-- Receipt items mirror the corresponding purchase order items.
INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price)
SELECT
    r.id,
    poi.product_id,
    poi.quantity,
    poi.unit_price
FROM receipts r
JOIN purchase_order_items poi
    ON poi.purchase_order_id = r.purchase_order_id;

COMMIT;

-- ------------------------------------------------------------
-- Optional verification queries
-- ------------------------------------------------------------

-- SELECT COUNT(*) AS customer_count FROM customers;            -- 10
-- SELECT COUNT(*) AS product_count FROM products;              -- 200
-- SELECT COUNT(*) AS category_count FROM categories;           -- 10
-- SELECT COUNT(*) AS purchase_order_count FROM purchase_orders; -- 12
-- SELECT COUNT(*) AS receipt_count FROM receipts;              -- 8
-- 