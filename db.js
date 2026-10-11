/*
 * SQLite Database (sql.js - 100% JavaScript, không cần build tools)
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'htx-binhmy.db');

let database;

const ready = (async () => {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
  });

  if (fs.existsSync(dbPath)) {
    database = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)));
  } else {
    database = new SQL.Database();
  }

  // Schema
  database.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      description TEXT DEFAULT '',
      stock INTEGER DEFAULT 0,
      vietgap INTEGER DEFAULT 1,
      image TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed nếu trống
  const res = database.exec("SELECT COUNT(*) AS c FROM products");
  const count = res.length ? res[0].values[0][0] : 0;
  if (count === 0) {
    const samples = [
      ['Lúa ST25 Bình Mỹ', 'Lúa gạo', 15000, 'kg', 'Giống lúa ST25 thơm ngon, canh tác theo chuẩn VietGAP', 5000, 1, '🌾'],
      ['Gạo ST25 đóng gói', 'Lúa gạo', 28000, 'túi 5kg', 'Gạo ST25 xay xát, đóng túi 5kg chân không', 800, 1, '🍚'],
      ['Mãng cầu Bình Mỹ', 'Trái cây', 65000, 'kg', 'Mãng cầu xiêm tươi, đạt chuẩn VietGAP', 300, 1, '🍈'],
      ['Xoài cát Hòa Lộc', 'Trái cây', 55000, 'kg', 'Xoài cát Hòa Lộc chín tự nhiên', 450, 1, '🥭'],
      ['Rau muống hữu cơ', 'Rau củ', 18000, 'bó 500g', 'Rau muống sạch canh tác hữu cơ', 200, 1, '🥬'],
      ['Bưởi da xanh', 'Trái cây', 45000, 'trái', 'Bưởi da xanh Bình Mỹ, ruột hồng, vị ngọt thanh', 600, 1, '🍊'],
      ['Khoai mì (sắn)', 'Củ', 8000, 'kg', 'Khoai mì tươi, dùng chế biến hoặc xuất khẩu', 2000, 1, '🥔'],
      ['Đường thốt nốt', 'Đặc sản', 90000, 'chai 500ml', 'Đường thốt nốt nguyên chất, không pha trộn', 150, 0, '🍯'],
      // ===== 8 sản phẩm bổ sung =====
      ['Dưa hấu ruột đỏ', 'Trái cây', 22000, 'kg', 'Dưa hấu Bình Mỹ ruột đỏ, vỏ xanh, ngọt mát', 350, 1, '🍉'],
      ['Cà chua cherry', 'Rau củ', 35000, 'hộp 500g', 'Cà chua cherry trồng tại Bình Mỹ, ngọt tự nhiên', 120, 1, '🍅'],
      ['Khổ qua rừng', 'Rau củ', 28000, 'kg', 'Khổ qua rừng hữu cơ, vị đắng nhẹ, tốt cho sức khoẻ', 80, 1, '🥒'],
      ['Bắp nếp Bình Mỹ', 'Củ', 12000, 'kg', 'Bắp nếp non, dẻo thơm, ăn luộc hoặc nướng', 600, 1, '🌽'],
      ['Mít Thái siêu sớm', 'Trái cây', 48000, 'kg', 'Mít Thái giống siêu sớm, múi to, ít xơ, ngọt đậm', 250, 1, '🍈'],
      ['Dừa tươi', 'Trái cây', 15000, 'trái', 'Dừa tươi nguyên vỏ, nước ngọt mát tự nhiên', 400, 0, '🥥'],
      ['Nước mắm cốt', 'Đặc sản', 120000, 'chai 500ml', 'Nước mắm cốt nhĩ 1, đạt chuẩn OCOP 4 sao', 200, 0, '🐟'],
      ['Mật ong hoa nhãn', 'Đặc sản', 250000, 'hũ 500g', 'Mật ong hoa nhãn nguyên chất, 100% tự nhiên', 90, 1, '🍯'],
      // ===== 10 sản phẩm ẢO để TEST (đánh dấu prefix [TEST]) =====
      ['[TEST] Thanh long ruột đỏ', 'Trái cây', 35000, 'kg', '[SẢN PHẨM TEST] Thanh long Bình Thuận giả lập', 999, 1, '🌵'],
      ['[TEST] Cam sành Cao Phong', 'Trái cây', 42000, 'kg', '[SẢN PHẨM TEST] Cam sành giả lập để thử UI', 999, 1, '🍊'],
      ['[TEST] Chuối già hương', 'Trái cây', 18000, 'nải', '[SẢN PHẨM TEST] Chuối già giả lập, chín tự nhiên', 999, 0, '🍌'],
      ['[TEST] Cải bó xôi Đà Lạt', 'Rau củ', 25000, 'bó 300g', '[SẢN PHẨM TEST] Cải bó xôi giả lập organic', 999, 1, '🥬'],
      ['[TEST] Cà rốt Đà Lạt', 'Củ', 22000, 'kg', '[SẢN PHẨM TEST] Cà rốt giả lập, ngọt giòn', 999, 1, '🥕'],
      ['[TEST] Khoai lang mật', 'Củ', 30000, 'kg', '[SẢN PHẨM TEST] Khoai lang mật giả lập, bùi thơm', 999, 1, '🍠'],
      ['[TEST] Trứng gà ta', 'Đặc sản', 45000, 'vỉ 10 quả', '[SẢN PHẨM TEST] Trứng gà ta thả vườn giả lập', 999, 1, '🥚'],
      ['[TEST] Tôm sú Cà Mau', 'Đặc sản', 280000, 'kg', '[SẢN PHẨM TEST] Tôm sú biển giả lập, size 20', 999, 1, '🦐'],
      ['[TEST] Gạo lứt huyết rồng', 'Lúa gạo', 38000, 'túi 2kg', '[SẢN PHẨM TEST] Gạo lứt hữu cơ giả lập', 999, 1, '🌾'],
      ['[TEST] Sầu riêng Ri6', 'Trái cây', 180000, 'kg', '[SẢN PHẨM TEST] Sầu riêng Ri6 giả lập, cơm vàng', 999, 1, '🍈']
    ];
    const insertSQL = `
      INSERT INTO products (name, category, price, unit, description, stock, vietgap, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    for (const s of samples) {
      const stmt = database.prepare(insertSQL);
      stmt.bind(s);
      stmt.step();
      stmt.free();
    }
    persist();
    console.log(`✅ Seeded ${samples.length} sản phẩm mẫu (bao gồm 10 sản phẩm [TEST])`);
  } else {
    // DB đã có -> bổ sung thêm nếu thiếu (idempotent theo tên)
    const extras = [
      ['Dưa hấu ruột đỏ', 'Trái cây', 22000, 'kg', 'Dưa hấu Bình Mỹ ruột đỏ, vỏ xanh, ngọt mát', 350, 1, '🍉'],
      ['Cà chua cherry', 'Rau củ', 35000, 'hộp 500g', 'Cà chua cherry trồng tại Bình Mỹ, ngọt tự nhiên', 120, 1, '🍅'],
      ['Khổ qua rừng', 'Rau củ', 28000, 'kg', 'Khổ qua rừng hữu cơ, vị đắng nhẹ, tốt cho sức khoẻ', 80, 1, '🥒'],
      ['Bắp nếp Bình Mỹ', 'Củ', 12000, 'kg', 'Bắp nếp non, dẻo thơm, ăn luộc hoặc nướng', 600, 1, '🌽'],
      ['Mít Thái siêu sớm', 'Trái cây', 48000, 'kg', 'Mít Thái giống siêu sớm, múi to, ít xơ, ngọt đậm', 250, 1, '🍈'],
      ['Dừa tươi', 'Trái cây', 15000, 'trái', 'Dừa tươi nguyên vỏ, nước ngọt mát tự nhiên', 400, 0, '🥥'],
      ['Nước mắm cốt', 'Đặc sản', 120000, 'chai 500ml', 'Nước mắm cốt nhĩ 1, đạt chuẩn OCOP 4 sao', 200, 0, '🐟'],
      ['Mật ong hoa nhãn', 'Đặc sản', 250000, 'hũ 500g', 'Mật ong hoa nhãn nguyên chất, 100% tự nhiên', 90, 1, '🍯'],
      // 10 sản phẩm TEST
      ['[TEST] Thanh long ruột đỏ', 'Trái cây', 35000, 'kg', '[SẢN PHẨM TEST] Thanh long Bình Thuận giả lập', 999, 1, '🌵'],
      ['[TEST] Cam sành Cao Phong', 'Trái cây', 42000, 'kg', '[SẢN PHẨM TEST] Cam sành giả lập để thử UI', 999, 1, '🍊'],
      ['[TEST] Chuối già hương', 'Trái cây', 18000, 'nải', '[SẢN PHẨM TEST] Chuối già giả lập, chín tự nhiên', 999, 0, '🍌'],
      ['[TEST] Cải bó xôi Đà Lạt', 'Rau củ', 25000, 'bó 300g', '[SẢN PHẨM TEST] Cải bó xôi giả lập organic', 999, 1, '🥬'],
      ['[TEST] Cà rốt Đà Lạt', 'Củ', 22000, 'kg', '[SẢN PHẨM TEST] Cà rốt giả lập, ngọt giòn', 999, 1, '🥕'],
      ['[TEST] Khoai lang mật', 'Củ', 30000, 'kg', '[SẢN PHẨM TEST] Khoai lang mật giả lập, bùi thơm', 999, 1, '🍠'],
      ['[TEST] Trứng gà ta', 'Đặc sản', 45000, 'vỉ 10 quả', '[SẢN PHẨM TEST] Trứng gà ta thả vườn giả lập', 999, 1, '🥚'],
      ['[TEST] Tôm sú Cà Mau', 'Đặc sản', 280000, 'kg', '[SẢN PHẨM TEST] Tôm sú biển giả lập, size 20', 999, 1, '🦐'],
      ['[TEST] Gạo lứt huyết rồng', 'Lúa gạo', 38000, 'túi 2kg', '[SẢN PHẨM TEST] Gạo lứt hữu cơ giả lập', 999, 1, '🌾'],
      ['[TEST] Sầu riêng Ri6', 'Trái cây', 180000, 'kg', '[SẢN PHẨM TEST] Sầu riêng Ri6 giả lập, cơm vàng', 999, 1, '🍈']
    ];
    const insertSQL = `
      INSERT INTO products (name, category, price, unit, description, stock, vietgap, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    let added = 0;
    for (const s of extras) {
      const checkRes = database.exec(`SELECT COUNT(*) AS c FROM products WHERE name = '${s[0].replace(/'/g, "''")}'`);
      const c = checkRes.length ? checkRes[0].values[0][0] : 0;
      if (c === 0) {
        const stmt = database.prepare(insertSQL);
        stmt.bind(s);
        stmt.step();
        stmt.free();
        added++;
      }
    }
    if (added > 0) {
      persist();
      console.log(`✅ Bổ sung thêm ${added} sản phẩm mới`);
    }
  }

  console.log('✅ Database sẵn sàng tại', dbPath);
  return database;
})();

function persist() {
  if (!database) return;
  const data = database.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

const db = {
  prepare(sql) {
    return {
      all(...params) {
        try {
          if (!database) throw new Error('DB chưa sẵn sàng');
          const stmt = database.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          const out = [];
          while (stmt.step()) out.push(stmt.getAsObject());
          stmt.free();
          return out;
        } catch (e) {
          console.error('DB.all error:', e.message, 'SQL:', sql, 'params:', params);
          throw e;
        }
      },
      get(...params) {
        try {
          if (!database) throw new Error('DB chưa sẵn sàng');
          const stmt = database.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          let row;
          if (stmt.step()) row = stmt.getAsObject();
          stmt.free();
          return row;
        } catch (e) {
          console.error('DB.get error:', e.message, 'SQL:', sql, 'params:', params);
          throw e;
        }
      },
      run(...params) {
        try {
          if (!database) throw new Error('DB chưa sẵn sàng');
          const stmt = database.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          stmt.step();
          const lastId = database.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
          stmt.free();
          const changes = database.getRowsModified();
          persist();
          return { lastInsertRowid: Number(lastId), changes };
        } catch (e) {
          console.error('DB.run error:', e.message, 'SQL:', sql, 'params:', params);
          throw e;
        }
      }
    };
  },
  async ready() { await ready; },
  // Expose raw database for advanced ops
  async exec(sql) {
    await ready;
    database.run(sql);
    persist();
  }
};

module.exports = db;
