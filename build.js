/*
 * Render.com build script: chạy sau khi npm install
 * Mục đích: khởi tạo thư mục data/ cho SQLite
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data/ directory');
}
