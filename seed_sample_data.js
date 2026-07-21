const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'supplierpro',
  password: 'T34m1tb4l1',
  port: 5432,
});

async function seedData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if there are already invoices
    const { rows: existingInvoices } = await client.query('SELECT count(*) FROM sales_invoices');
    if (parseInt(existingInvoices[0].count) < 3) {
      console.log('Seeding sales_invoices (Piutang)...');
      await client.query(`
        INSERT INTO sales_invoices (id, date, customer_id, total, paid_amount, payment_type_id, status) VALUES
        ('INV-SEED-1', '2026-06-01', NULL, 1500000, 500000, 'PT-1', 'Sebagian'),
        ('INV-SEED-2', '2026-06-03', NULL, 2000000, 0, 'PT-2', 'Belum Bayar')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Check if there are already purchases
    const { rows: existingPurchases } = await client.query('SELECT count(*) FROM purchase_orders');
    if (parseInt(existingPurchases[0].count) < 3) {
      console.log('Seeding purchase_orders (Hutang)...');
      await client.query(`
        INSERT INTO purchase_orders (id, date, vendor_id, total, paid_amount, payment_type_id, status) VALUES
        ('PO-SEED-1', '2026-06-02', NULL, 5000000, 1000000, 'PT-1', 'proses'),
        ('PO-SEED-2', '2026-06-04', NULL, 3000000, 0, 'PT-2', 'proses')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // Check cash transactions
    const { rows: existingCash } = await client.query('SELECT count(*) FROM cash_transactions');
    if (parseInt(existingCash[0].count) < 4) {
      console.log('Seeding cash_transactions (Arus Kas)...');
      await client.query(`
        INSERT INTO cash_transactions (id, date, type, category, description, amount, method, invoice_id, purchase_order_id, user_id) VALUES
        ('CT-SEED-1', '2026-06-01', 'IN', 'Pendapatan', 'DP Invoice INV-SEED-1', 500000, 'Transfer Bank', 'INV-SEED-1', NULL, NULL),
        ('CT-SEED-2', '2026-06-02', 'OUT', 'Pembelian Stok', 'DP PO PO-SEED-1', 1000000, 'Tunai', NULL, 'PO-SEED-1', NULL),
        ('CT-SEED-3', '2026-06-05', 'OUT', 'Operasional', 'Biaya Listrik & Air', 350000, 'Tunai', NULL, NULL, NULL),
        ('CT-SEED-4', '2026-06-05', 'IN', 'Pendapatan', 'Penjualan Retail Langsung', 1200000, 'Transfer Bank', NULL, NULL, NULL)
        ON CONFLICT (id) DO NOTHING;
      `);
    }
    
    await client.query('COMMIT');
    console.log('Seed sample data completed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedData();
