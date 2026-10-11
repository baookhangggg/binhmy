const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const r = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch (e) { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  console.log('=== 1. HEALTH ===');
  console.log(await req('GET', '/api/health'));

  console.log('\n=== 2. LIST (page 1, limit 5) ===');
  const list = await req('GET', '/api/products?page=1&limit=5');
  console.log('count:', list.body.count, 'total:', list.body.pagination?.total, 'pages:', list.body.pagination?.totalPages);

  console.log('\n=== 3. LOGIN admin ===');
  const login = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  console.log('user:', login.body.data?.user);
  const token = login.body.data?.token;

  console.log('\n=== 4. CREATE (with auth, correct category) ===');
  const newProd = await req('POST', '/api/products', {
    name: 'Khoai lang Bình Mỹ',
    category: 'Củ',
    price: 22000,
    unit: 'kg',
    description: 'Khoai lang Bình Mỹ ruột vàng, ngọt bùi',
    stock: 300,
    vietgap: true
  }, token);
  console.log('Created id:', newProd.body.data?.id, '| name:', newProd.body.data?.name);
  const newId = newProd.body.data?.id;

  console.log('\n=== 5. UPDATE ===');
  const upd = await req('PUT', `/api/products/${newId}`, { stock: 250, price: 25000 }, token);
  console.log('Updated stock:', upd.body.data?.stock, '| price:', upd.body.data?.price);

  console.log('\n=== 6. DELETE ===');
  const del = await req('DELETE', `/api/products/${newId}`, null, token);
  console.log('Deleted:', del.body);

  console.log('\n=== 7. UNAUTHORIZED CREATE ===');
  const noAuth = await req('POST', '/api/products', { name: 'X', category: 'Củ', price: 1 });
  console.log('Status:', noAuth.status, '| Error:', noAuth.body.error);

  console.log('\n=== 8. INVALID INPUT ===');
  const bad = await req('POST', '/api/products', { name: '', category: 'XYZ', price: -1 }, token);
  console.log('Status:', bad.status, '| Error:', bad.body.error);

  console.log('\n=== 9. WRONG LOGIN ===');
  const wrong = await req('POST', '/api/auth/login', { username: 'admin', password: 'sai' });
  console.log('Status:', wrong.status, '| Error:', wrong.body.error);

  console.log('\n=== 10. /me (auth check) ===');
  const me = await req('GET', '/api/auth/me', null, token);
  console.log('User:', me.body.data);
})();
