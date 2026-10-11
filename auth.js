/*
 * HTX Bình Mỹ — Auth module
 * JWT + bcrypt + in-memory user store (sẽ migrate sang DB khi có bảng users).
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============== User store (in-memory, idempotent) ==============
// Trong production, chuyển sang bảng `users` trong DB và thêm rate-limit cho login.
const users = new Map();

function seedDefaultUser() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  if (!users.has(username)) {
    const hash = bcrypt.hashSync(password, 10);
    users.set(username, { id: 1, username, passwordHash: hash, role: 'admin' });
    logger.info({ username }, 'Default admin user seeded');
  }
}

function findUser(username) { return users.get(username); }

function verifyPassword(plain, hash) { return bcrypt.compareSync(plain, hash); }

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch (e) { return null; }
}

// ============== Middleware ==============
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Thiếu token xác thực' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' });
  req.user = payload;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Chưa xác thực' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
    }
    next();
  };
}

module.exports = {
  seedDefaultUser, findUser, verifyPassword, signToken, verifyToken,
  authenticate, requireRole
};
