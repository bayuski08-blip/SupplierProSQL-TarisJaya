const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:T34m1tb4l1@localhost:5432/supplierpro' });

const dummyData = [
    { type: 'IN', cat: 'Pendapatan', desc: 'Penjualan retail', amount: 1500000, method: 'QRIS' },
    { type: 'OUT', cat: 'Pembelian Stok', desc: 'Beli kopi arabica dari supplier', amount: 450000, method: 'Transfer Bank' },
    { type: 'OUT', cat: 'Operasional', desc: 'Bayar listrik bulan ini', amount: 850000, method: 'Transfer Bank' },
    { type: 'IN', cat: 'Pendapatan', desc: 'Invoice PT ABC Lunas', amount: 3200000, method: 'Transfer Bank' },
    { type: 'OUT', cat: 'Operasional', desc: 'Beli token pulsa & internet', amount: 350000, method: 'Tunai' },
    { type: 'OUT', cat: 'Gaji', desc: 'Gaji karyawan shift pagi', amount: 4500000, method: 'Transfer Bank' },
    { type: 'IN', cat: 'Pendapatan', desc: 'Penjualan toko kasir', amount: 800000, method: 'Tunai' },
    { type: 'OUT', cat: 'Operasional', desc: 'Perbaikan AC', amount: 400000, method: 'Tunai' },
    { type: 'OUT', cat: 'Sewa', desc: 'Sewa ruko bulan Juni', amount: 3000000, method: 'Transfer Bank' },
    { type: 'IN', cat: 'Lainnya', desc: 'Cashback promo bank', amount: 50000, method: 'Transfer Bank' },
    { type: 'OUT', cat: 'Operasional', desc: 'Beli ATK', amount: 120000, method: 'Tunai' },
    { type: 'IN', cat: 'Pendapatan', desc: 'Penjualan harian', amount: 2100000, method: 'QRIS' },
    { type: 'OUT', cat: 'Pembelian Stok', desc: 'Beli sirup marjan', amount: 500000, method: 'Transfer Bank' },
    { type: 'OUT', cat: 'Operasional', desc: 'Bensin kendaraan operasional', amount: 150000, method: 'Tunai' },
    { type: 'IN', cat: 'Pendapatan', desc: 'Penjualan grosir minimarket', amount: 4500000, method: 'Transfer Bank' },
    { type: 'OUT', cat: 'Pembelian Stok', desc: 'Beli kemasan botol plastik', amount: 750000, method: 'Transfer Bank' },
    { type: 'OUT', cat: 'Lainnya', desc: 'Iuran kebersihan lingkungan', amount: 50000, method: 'Tunai' },
    { type: 'IN', cat: 'Pendapatan', desc: 'Penjualan toko kasir', amount: 1100000, method: 'QRIS' },
    { type: 'OUT', cat: 'Gaji', desc: 'Bonus lembur karyawan', amount: 300000, method: 'Transfer Bank' },
    { type: 'IN', cat: 'Pendapatan', desc: 'DP pesanan katering', amount: 1000000, method: 'Transfer Bank' }
];

async function seed() {
    let day = 1;
    for (const d of dummyData) {
        const id = 'CT-DUMMY-' + Math.floor(Math.random() * 1000000);
        const date = `2026-06-${day.toString().padStart(2, '0')}`;
        
        await pool.query(
            'INSERT INTO cash_transactions (id, date, type, category, description, amount, method) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, date, d.type, d.cat, d.desc, d.amount, d.method]
        );
        day = (day % 30) + 1; // distribute over days
    }
    console.log('20 dummy transactions inserted');
    pool.end();
}

seed().catch(console.error);
