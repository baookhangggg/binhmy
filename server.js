/*
 * HTX Nông nghiệp Bình Mỹ — Backend Server
 * Production-ready: helmet, compression, rate-limit, JWT auth, validation, logging.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const db = require('./db');
const logger = require('./logger');
const auth = require('./auth');
const {
  productCreateSchema, productUpdateSchema, loginSchema, productQuerySchema
} = require('./validation');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ============== Trust proxy (khi chạy sau Nginx/Cloudflare) ==============
app.set('trust proxy', 1);

// ============== Request ID ==============
app.use((req, _res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  next();
});

// ============== Security headers ==============
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    }
  } : false,
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  crossOriginEmbedderPolicy: false,
}));

// ============== Compression ==============
app.use(compression());

// ============== CORS ==============
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500,https://baookhangggg.github.io')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Cho phép curl/server-to-server (không có origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return cb(null, true);
    return cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true
}));

// ============== Body parser ==============
app.use(express.json({ limit: '2mb' }));

// ============== Static files (với cache) ==============
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
  index: 'index.html'
}));

// ============== Request logger ==============
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      reqId: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      ms: Date.now() - start,
      ip: req.ip
    });
  });
  next();
});

// ============== Rate limit ==============
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: isProd ? 300 : 1000,   // dev: 1000, prod: 300
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Quá nhiều request, vui lòng thử lại sau 15 phút' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                    // 10 lần login / 15 phút
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Quá nhiều lần đăng nhập sai, vui lòng thử lại sau 15 phút' }
});

// ============== Helpers ==============
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return next({ status: 400, message: error.details.map(d => d.message).join('; ') });
    }
    req[source] = value;
    next();
  };
}

// ============== Public routes ==============
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'HTX Bình Mỹ API',
    version: '2.0.0',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

app.get('/api/products', apiLimiter, validate(productQuerySchema, 'query'), asyncH(async (req, res) => {
  const { q, category, page, limit } = req.query;
  const offset = (page - 1) * limit;

  const where = ['1=1'];
  const params = [];
  if (q) { where.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { where.push('category = ?'); params.push(category); }

  const whereSQL = where.join(' AND ');
  const rows = db.prepare(`SELECT * FROM products WHERE ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM products WHERE ${whereSQL}`).get(...params);
  const total = totalRow.c;

  res.json({
    success: true,
    count: rows.length,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: rows
  });
}));

app.get('/api/products/categories/list', asyncH(async (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json({ success: true, data: rows.map(r => r.category) });
}));

app.get('/api/products/:id', asyncH(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
  }
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
  res.json({ success: true, data: row });
}));

// ============== Auth routes ==============
app.post('/api/auth/login', authLimiter, validate(loginSchema), asyncH(async (req, res) => {
  const { username, password } = req.body;
  const user = auth.findUser(username);
  if (!user || !auth.verifyPassword(password, user.passwordHash)) {
    logger.warn({ username, ip: req.ip }, 'Login failed');
    return res.status(401).json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  const token = auth.signToken(user);
  logger.info({ username, ip: req.ip }, 'Login success');
  res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role } } });
}));

app.get('/api/auth/me', auth.authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

// ============== Protected routes (admin only) ==============
app.post('/api/products', auth.authenticate, auth.requireRole('admin', 'editor'),
  validate(productCreateSchema), asyncH(async (req, res) => {
    const { name, category, price, unit, description, stock, vietgap, image } = req.body;
    const info = db.prepare(`
      INSERT INTO products (name, category, price, unit, description, stock, vietgap, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, category, price, unit, description, stock, vietgap ? 1 : 0, image);
    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    logger.info({ reqId: req.id, productId: created.id, user: req.user.username }, 'Product created');
    res.status(201).json({ success: true, data: created });
  })
);

app.put('/api/products/:id', auth.authenticate, auth.requireRole('admin', 'editor'),
  validate(productUpdateSchema), asyncH(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });

    const merged = { ...existing, ...req.body };
    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, price = ?, unit = ?, description = ?,
          stock = ?, vietgap = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      merged.name, merged.category, Number(merged.price),
      merged.unit, merged.description, Number(merged.stock),
      merged.vietgap ? 1 : 0, merged.image, id
    );
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    logger.info({ reqId: req.id, productId: id, user: req.user.username }, 'Product updated');
    res.json({ success: true, data: updated });
  })
);

app.delete('/api/products/:id', auth.authenticate, auth.requireRole('admin'),
  asyncH(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy sản phẩm' });
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    logger.warn({ reqId: req.id, productId: id, user: req.user.username }, 'Product deleted');
    res.json({ success: true, deleted: id });
  })
);

// ============== 404 cho API ==============
app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'API endpoint không tồn tại' }));

// ============== Centralized error handler ==============
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  logger.error({ reqId: req.id, err: err.message, stack: err.stack, url: req.url }, 'Request error');
  res.status(status).json({
    success: false,
    error: isProd && status === 500 ? 'Lỗi máy chủ nội bộ' : err.message
  });
});

// ============== Graceful shutdown ==============
function shutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

// ============== Start ==============
let server;
(async () => {
  await db.ready();
  auth.seedDefaultUser();
  server = app.listen(PORT, () => {
  if (isProd && process.env.PORT) {
    logger.info(`🚀 HTX Bình Mỹ API (production): http://0.0.0.0:${PORT}`);
  } else {
    logger.info(`🚀 HTX Bình Mỹ API: http://localhost:${PORT}`);
  }
  logger.info(`   Health:   /api/health`);
  logger.info(`   Products: /api/products`);
  logger.info(`   Login:    POST /api/auth/login`);
  logger.info(`   Default:  ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  });
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
