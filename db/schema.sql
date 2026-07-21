-- =============================================
-- SupplierPro Database Schema (PRD2 Master Data Update)
-- =============================================

-- Master Tables
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_units (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_types (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'kasir',
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  sku VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) REFERENCES product_categories(id) ON DELETE SET NULL,
  cost_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  unit_id VARCHAR(255) REFERENCES product_units(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  customer_category_id VARCHAR(255) REFERENCES customer_categories(id) ON DELETE SET NULL,
  phone VARCHAR(255),
  city VARCHAR(255),
  address TEXT,
  credit_lmt NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vendor_category_id VARCHAR(255) REFERENCES vendor_categories(id) ON DELETE SET NULL,
  phone VARCHAR(255),
  city VARCHAR(255),
  address TEXT,
  id_number VARCHAR(255),
  nama_bank VARCHAR(255),
  nomor_rek VARCHAR(255),
  pemilik_rek VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL,
  reason TEXT,
  adjustment_date DATE DEFAULT CURRENT_DATE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(255),
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE SET NULL,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_date VARCHAR(255),
  payment_type_id VARCHAR(255) REFERENCES payment_types(id) ON DELETE SET NULL,
  payment_method VARCHAR(255),
  status VARCHAR(255) DEFAULT 'belum',
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(255) PRIMARY KEY,
  invoice_id VARCHAR(255) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  customer_fee NUMERIC DEFAULT 0,
  fee_notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(255) PRIMARY KEY,
  date VARCHAR(255),
  vendor_id VARCHAR(255) REFERENCES vendors(id) ON DELETE SET NULL,
  total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_date VARCHAR(255),
  payment_type_id VARCHAR(255) REFERENCES payment_types(id) ON DELETE SET NULL,
  status VARCHAR(255) DEFAULT 'proses',
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id VARCHAR(255) PRIMARY KEY,
  purchase_order_id VARCHAR(255) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  cost NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id VARCHAR(255) PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  category VARCHAR(255),
  description TEXT,
  amount NUMERIC NOT NULL,
  method VARCHAR(255),
  invoice_id VARCHAR(255) REFERENCES sales_invoices(id) ON DELETE SET NULL,
  purchase_order_id VARCHAR(255) REFERENCES purchase_orders(id) ON DELETE SET NULL,
  payment_type_id VARCHAR(255) REFERENCES payment_types(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS cash_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(10) CHECK (type IN ('IN', 'OUT', 'BOTH')) DEFAULT 'BOTH',
  is_system BOOLEAN DEFAULT false
);

