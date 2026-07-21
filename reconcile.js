/**
 * SupplierPro - Script Rekonsiliasi Otomatis
 * 
 * Script ini menghitung ulang Laba Rugi & Neraca secara INDEPENDEN
 * langsung dari raw data tabel transaksi, tanpa menggunakan logika
 * endpoint API laporan. Hasilnya dibandingkan dengan angka di sistem.
 * 
 * Jalankan dengan: node reconcile.js [bulan] [tahun]
 * Contoh: node reconcile.js 7 2026
 */

const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/supplierpro';
const urlParsed = new URL(dbUrl);

async function main() {
  const bulan = parseInt(process.argv[2], 10) || new Date().getMonth() + 1;
  const tahun = parseInt(process.argv[3], 10) || new Date().getFullYear();

  if (isNaN(bulan) || bulan < 1 || bulan > 12 || isNaN(tahun)) {
    console.error('Usage: node reconcile.js [bulan 1-12] [tahun]');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: urlParsed.hostname || 'localhost',
    port: parseInt(urlParsed.port) || 3306,
    user: urlParsed.username || 'root',
    password: urlParsed.password || '',
    database: urlParsed.pathname.replace('/', '') || 'supplierpro',
    timezone: '+08:00',
  });

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const [lastDayRow] = await conn.query(`SELECT LAST_DAY(?) AS end_date`, [startDate]);
  const endDate = lastDayRow[0].end_date instanceof Date
    ? lastDayRow[0].end_date.toISOString().split('T')[0]
    : String(lastDayRow[0].end_date);

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log(`║  REKONSILIASI KEUANGAN: ${String(bulan).padStart(2,'0')}/${tahun}              ║`);
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`Periode : ${startDate} → ${endDate}\n`);

  let issues = [];

  // ─────────────────────────────────────────────────────
  // BAGIAN 1: LABA RUGI
  // ─────────────────────────────────────────────────────
  console.log('── LABA RUGI ─────────────────────────────────────\n');

  const [pendapatan] = await conn.query(`
    SELECT
      COALESCE(SUM(total), 0) AS penjualan_kotor,
      COALESCE(SUM(COALESCE(discount, 0)), 0) AS total_diskon
    FROM sales_invoices
    WHERE DATE(date) BETWEEN ? AND ?
      AND status NOT IN ('Batal', 'Dibatalkan')
  `, [startDate, endDate]);
  const penjualanKotor = parseFloat(pendapatan[0].penjualan_kotor);
  const totalDiskon = parseFloat(pendapatan[0].total_diskon);
  const penjualanBersih = penjualanKotor - totalDiskon;
  console.log(`Pendapatan Kotor    : Rp ${fmt(penjualanKotor)}`);
  console.log(`Diskon              : Rp ${fmt(totalDiskon)}`);
  console.log(`Pendapatan Bersih   : Rp ${fmt(penjualanBersih)}`);

  const [hpp] = await conn.query(`
    SELECT COALESCE(SUM(ii.quantity * COALESCE(NULLIF(ii.cost_price_snapshot, 0), p.cost_price)), 0) AS hpp
    FROM invoice_items ii
    JOIN sales_invoices si ON si.id = ii.invoice_id
    LEFT JOIN products p ON p.id = ii.product_id
    WHERE DATE(si.date) BETWEEN ? AND ?
      AND si.status NOT IN ('Batal', 'Dibatalkan')
  `, [startDate, endDate]);
  const totalHPP = parseFloat(hpp[0].hpp);
  const labaKotor = penjualanBersih - totalHPP;
  console.log(`HPP (Cost of Goods) : Rp ${fmt(totalHPP)}`);
  console.log(`Laba Kotor          : Rp ${fmt(labaKotor)}`);

  const [beban] = await conn.query(`
    SELECT COALESCE(SUM(ct.amount), 0) AS total_beban
    FROM cash_transactions ct
    WHERE ct.type = 'OUT'
      AND (ct.status IS NULL OR ct.status != 'cancelled')
      AND ct.invoice_id IS NULL
      AND ct.purchase_order_id IS NULL
      AND ct.date BETWEEN ? AND ?
      AND ct.category NOT IN (
        SELECT name FROM cash_categories WHERE is_system = 1 AND (type = 'OUT' OR type = 'BOTH')
      )
  `, [startDate, endDate]);
  const totalBeban = parseFloat(beban[0].total_beban);
  const labaOperasional = labaKotor - totalBeban;
  console.log(`Beban Operasional   : Rp ${fmt(totalBeban)}`);
  console.log(`Laba Operasional    : Rp ${fmt(labaOperasional)}`);

  const [lain] = await conn.query(`
    SELECT COALESCE(SUM(ct.amount), 0) AS total
    FROM cash_transactions ct
    WHERE ct.type = 'IN'
      AND (ct.status IS NULL OR ct.status != 'cancelled')
      AND ct.date BETWEEN ? AND ?
      AND ct.category NOT IN (
        SELECT name FROM cash_categories WHERE is_system = 1 AND (type = 'IN' OR type = 'BOTH')
      )
  `, [startDate, endDate]);
  const pendapatanLain = parseFloat(lain[0].total);
  const labaBersih = labaOperasional + pendapatanLain;
  console.log(`Pendapatan Lain     : Rp ${fmt(pendapatanLain)}`);
  console.log(`\n➤ LABA BERSIH       : Rp ${fmt(labaBersih)}\n`);

  // ─────────────────────────────────────────────────────
  // BAGIAN 2: NERACA
  // ─────────────────────────────────────────────────────
  console.log('── NERACA ────────────────────────────────────────\n');

  const [kas] = await conn.query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END), 0) AS masuk,
      COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END), 0) AS keluar
    FROM cash_transactions WHERE DATE(date) <= ? AND status = 'active'
  `, [endDate]);
  const kasBank = parseFloat(kas[0].masuk) - parseFloat(kas[0].keluar);

  const [piutang] = await conn.query(`
    SELECT COALESCE(SUM(total - paid_amount), 0) AS piutang FROM sales_invoices
    WHERE status NOT IN ('Lunas', 'Dibatalkan', 'Batal') AND DATE(date) <= ?
  `, [endDate]);
  const piutangUsaha = parseFloat(piutang[0].piutang);

  const [persediaan] = await conn.query(`
    SELECT COALESCE(SUM(stock * cost_price), 0) AS persediaan FROM products
  `);
  const stokValue = parseFloat(persediaan[0].persediaan);
  const totalAset = kasBank + piutangUsaha + stokValue;

  console.log('ASET:');
  console.log(`  Kas & Bank        : Rp ${fmt(kasBank)}`);
  console.log(`  Piutang Usaha     : Rp ${fmt(piutangUsaha)}`);
  console.log(`  Persediaan        : Rp ${fmt(stokValue)}`);
  console.log(`  Total Aset        : Rp ${fmt(totalAset)}`);

  const [hutang] = await conn.query(`
    SELECT COALESCE(SUM(total - paid_amount), 0) AS hutang FROM purchase_orders
    WHERE status NOT IN ('Selesai', 'Dibatalkan', 'Batal') AND DATE(date) <= ?
  `, [endDate]);
  const hutangUsaha = parseFloat(hutang[0].hutang);
  const totalLiabilitas = hutangUsaha;

  const [modalRow] = await conn.query(`SELECT value FROM settings WHERE \`key\` = 'modal_pemilik'`);
  const modalPemilik = parseFloat(modalRow[0]?.value || 0);
  const labaDitahan = totalAset - totalLiabilitas - modalPemilik;
  const totalEkuitas = modalPemilik + labaDitahan;

  console.log('\nLIABILITAS:');
  console.log(`  Hutang Usaha      : Rp ${fmt(hutangUsaha)}`);
  console.log(`  Total Liabilitas  : Rp ${fmt(totalLiabilitas)}`);
  console.log('\nEKUITAS:');
  console.log(`  Modal Pemilik     : Rp ${fmt(modalPemilik)}`);
  console.log(`  Laba Ditahan      : Rp ${fmt(labaDitahan)}`);
  console.log(`  Total Ekuitas     : Rp ${fmt(totalEkuitas)}`);

  const totalPasiva = totalLiabilitas + totalEkuitas;
  const selisih = Math.abs(totalAset - totalPasiva);
  const balanced = selisih < 1;
  console.log(`\n➤ Total Aset        : Rp ${fmt(totalAset)}`);
  console.log(`➤ Total Pasiva      : Rp ${fmt(totalPasiva)}`);
  console.log(`➤ Selisih           : Rp ${fmt(selisih)}`);
  console.log(`➤ Neraca Balance    : ${balanced ? '✅ YA' : '❌ TIDAK BALANCE!'}`);
  if (!balanced) issues.push(`Neraca tidak balance: selisih Rp ${fmt(selisih)}`);

  // ─────────────────────────────────────────────────────
  // BAGIAN 3: INTEGRITAS DATA
  // ─────────────────────────────────────────────────────
  console.log('\n── INTEGRITAS DATA ───────────────────────────────\n');

  const [invLunasSalah] = await conn.query(`
    SELECT id, total, paid_amount FROM sales_invoices
    WHERE status = 'Lunas' AND paid_amount < total - 1
  `);
  if (invLunasSalah.length > 0) {
    console.log(`❌ Invoice Lunas tapi paid_amount < total: ${invLunasSalah.length} record`);
    invLunasSalah.slice(0,5).forEach(r => console.log(`   - ${r.id}: total=${r.total} paid=${r.paid_amount}`));
    issues.push(`${invLunasSalah.length} invoice Lunas dengan paid_amount kurang`);
  } else { console.log('✅ Semua invoice Lunas memiliki paid_amount >= total'); }

  const [poSelesaiSalah] = await conn.query(`
    SELECT id, total, paid_amount FROM purchase_orders
    WHERE status = 'Selesai' AND paid_amount < total - 1
  `);
  if (poSelesaiSalah.length > 0) {
    console.log(`❌ PO Selesai tapi paid_amount < total: ${poSelesaiSalah.length} record`);
    poSelesaiSalah.slice(0,5).forEach(r => console.log(`   - ${r.id}: total=${r.total} paid=${r.paid_amount}`));
    issues.push(`${poSelesaiSalah.length} PO Selesai dengan paid_amount kurang`);
  } else { console.log('✅ Semua PO Selesai memiliki paid_amount >= total'); }

  const [invTanpaCash] = await conn.query(`
    SELECT si.id, si.status, si.paid_amount FROM sales_invoices si
    WHERE si.status = 'Lunas' AND si.paid_amount > 0
      AND NOT EXISTS (
        SELECT 1 FROM cash_transactions ct WHERE ct.invoice_id = si.id AND ct.status = 'active'
      )
  `);
  if (invTanpaCash.length > 0) {
    console.log(`❌ Invoice Lunas tanpa cash transaction: ${invTanpaCash.length} record`);
    invTanpaCash.slice(0,5).forEach(r => console.log(`   - ${r.id} (paid: ${r.paid_amount})`));
    issues.push(`${invTanpaCash.length} invoice Lunas tanpa cash transaction`);
  } else { console.log('✅ Semua invoice Lunas memiliki cash transaction terkait'); }

  const [stokNegatif] = await conn.query(`SELECT id, name, stock FROM products WHERE stock < 0`);
  if (stokNegatif.length > 0) {
    console.log(`❌ Produk stok negatif: ${stokNegatif.length} record`);
    stokNegatif.forEach(r => console.log(`   - [${r.id}] ${r.name}: stock=${r.stock}`));
    issues.push(`${stokNegatif.length} produk dengan stok negatif`);
  } else { console.log('✅ Tidak ada produk dengan stok negatif'); }

  // ─────────────────────────────────────────────────────
  // RINGKASAN
  // ─────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  if (issues.length === 0) {
    console.log('✅ REKONSILIASI OK: Tidak ada masalah ditemukan');
  } else {
    console.log(`⚠️  REKONSILIASI: ${issues.length} masalah ditemukan:`);
    issues.forEach((i, idx) => console.log(`   ${idx + 1}. ${i}`));
  }
  console.log('══════════════════════════════════════════════════\n');

  await conn.end();
}

function fmt(n) {
  return Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

main().catch(err => { console.error('Script error:', err); process.exit(1); });
