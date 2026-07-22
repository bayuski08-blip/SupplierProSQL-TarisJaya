-- =============================================
-- Seed Data untuk SupplierPro (MySQL - PPN Non Aktif)
-- =============================================

-- Master Data
INSERT IGNORE INTO product_categories (id, name) VALUES 
  ('PC-1', 'Minuman'), 
  ('PC-2', 'Makanan'), 
  ('PC-3', 'Sembako'), 
  ('PC-4', 'Lainnya');

INSERT IGNORE INTO product_units (id, name) VALUES 
  ('PU-1', 'pcs'), 
  ('PU-2', 'box'), 
  ('PU-3', 'botol'), 
  ('PU-4', 'dus'), 
  ('PU-5', 'pack'), 
  ('PU-6', 'sak'), 
  ('PU-7', 'kg'), 
  ('PU-8', 'karton');

INSERT IGNORE INTO customer_categories (id, name) VALUES 
  ('CC-1', 'Reseller'), 
  ('CC-2', 'Warung'), 
  ('CC-3', 'Kafe'), 
  ('CC-4', 'Toko');

INSERT IGNORE INTO vendor_categories (id, name) VALUES 
  ('VC-1', 'Minuman'), 
  ('VC-2', 'Makanan'), 
  ('VC-3', 'Sembako'), 
  ('VC-4', 'Non-Pangan');

INSERT IGNORE INTO payment_types (id, name) VALUES 
  ('PT-1', 'Tunai'), 
  ('PT-2', 'Transfer'),
  ('PT-3', 'Kredit 1 Hari'),
  ('PT-5', 'Kredit 7 Hari'),
  ('PT-6', 'Kredit 14 Hari'),
  ('PT-7', 'Kredit 30 Hari');

INSERT IGNORE INTO cash_categories (id, name, type, is_system) VALUES 
  (1, 'Penjualan', 'IN', 1),
  (2, 'Pelunasan Piutang', 'IN', 1),
  (3, 'Pembelian Stok', 'OUT', 1),
  (4, 'Penyesuaian Stok', 'OUT', 1),
  (5, 'Pelunasan Hutang', 'OUT', 1),
  (6, 'Gaji & Tunjangan', 'OUT', 0),
  (7, 'Sewa', 'OUT', 0),
  (8, 'Operasional', 'OUT', 0),
  (9, 'Marketing', 'OUT', 0),
  (10, 'Pajak', 'OUT', 0),
  (11, 'Pembelian Aset', 'OUT', 0),
  (12, 'Prive Pemilik', 'OUT', 0),
  (13, 'Pengeluaran Lainnya', 'OUT', 0),
  (14, 'Pendapatan Lainnya', 'IN', 0),
  (15, 'Pinjaman Masuk', 'IN', 0),
  (16, 'Setoran Modal', 'IN', 0),
  (17, 'Transfer Antar Kas/Bank', 'BOTH', 0);

-- Users
-- Passwords: admin=admin123, demo_finance=Finance123, demo_gudang=Gudang123, demo_kasir=Kasir123
INSERT IGNORE INTO users (id, username, name, email, password_hash, role, active) VALUES 
  (1, 'admin', 'Administrator', 'admin@supplierpro.id', 'admin123', 'admin', 1),
  (2, 'bayu', 'bayu', 'bayu.ski08@gmail.com', 'bayu', 'admin', 1),
  (3, 'demo_finance', 'Demo Finance', 'finance@supplierpro.id', 'Finance123', 'finance', 1),
  (4, 'demo_gudang', 'Demo Gudang', 'gudang@supplierpro.id', 'Gudang123', 'gudang', 1),
  (5, 'demo_kasir', 'Demo Kasir', 'kasir@supplierpro.id', 'Kasir123', 'kasir', 1);

-- Settings (PPN DINONAKTIFKAN)
INSERT IGNORE INTO settings (`key`, value) VALUES 
  ('modal_pemilik', '0'),
  ('prefix_cash_transaction', 'CT'),
  ('prefix_customer', 'C'),
  ('prefix_product', 'P'),
  ('prefix_purchase', 'PO-{YYYY}-{MM}-'),
  ('prefix_sales', 'INV-{YYYY}-{MM}-'),
  ('prefix_vendor', 'V'),
  ('ppn_enabled', 'false'),
  ('pajak_default', '11');
