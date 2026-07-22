const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, 'supplierpro_secret_key_demo', { expiresIn: '1h' });

const req = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    const request = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    request.on('error', reject);
    if (body) {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
};

(async () => {
  try {
    // 1. Create a PO
    const createPayload = {
      vendor_id: 'V000001',
      date: '2026-06-12',
      total: 50000,
      paid: 50000,
      payment_type_id: 'PT-1',
      due_date: '2026-06-12',
      items: [
        { product_id: 'P000001', qty: 2, price: 25000, total: 50000 }
      ]
    };
    const createRes = await req('POST', '/api/purchases', createPayload);
    console.log('Create PO:', createRes);
    
    const newPoId = createRes.id;
    console.log('Latest PO:', newPoId);

    // 2. Read PO items
    const itemsRes1 = await req('GET', `/api/purchases/${newPoId}/items`);
    console.log('Items before update:', itemsRes1.map(i => ({id: i.product_id, qty: i.quantity})));

    // 3. Update PO with changed quantities
    const updatePayload = {
      vendor_id: 'V000001',
      date: '2026-06-12',
      total: 75000,
      paid: 75000,
      payment_type_id: 'PT-1',
      due_date: '2026-06-12',
      items: [
        { product_id: 'P000001', qty: 3, price: 25000, total: 75000 }
      ]
    };
    const updateRes = await req('PUT', `/api/purchases/${newPoId}`, updatePayload);
    console.log('Update PO:', updateRes);

    // 4. Read PO items again
    const itemsRes2 = await req('GET', `/api/purchases/${newPoId}/items`);
    console.log('Items after update:', itemsRes2.map(i => ({id: i.product_id, qty: i.quantity})));

  } catch (err) {
    console.error(err);
  }
})();
