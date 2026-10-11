/* ============================================
 * HTX Bình Mỹ - API helper
 * Wraps fetch + JWT auth + error handling
 * ============================================ */

const API_BASE = (typeof window !== 'undefined' && window.API_BASE)
  || 'http://localhost:3000/api';

// ============== Token storage (sessionStorage: an toàn hơn localStorage) ==============
const TokenStore = {
  get: () => sessionStorage.getItem('htx_token'),
  set: (t) => sessionStorage.setItem('htx_token', t),
  clear: () => sessionStorage.removeItem('htx_token'),
  user: () => {
    const u = sessionStorage.getItem('htx_user');
    return u ? JSON.parse(u) : null;
  },
  setUser: (u) => sessionStorage.setItem('htx_user', JSON.stringify(u)),
};

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': crypto.randomUUID(),
    ...(options.headers || {})
  };
  // Tự động đính kèm token nếu có
  const token = TokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  let body;
  try { body = await res.json(); }
  catch (e) { body = { success: false, error: 'Phản hồi không phải JSON' }; }

  // Auto-logout khi token hết hạn
  if (res.status === 401 && token) {
    TokenStore.clear();
    sessionStorage.removeItem('htx_user');
    if (location.pathname.includes('admin') && !location.pathname.includes('login')) {
      location.href = '/admin.html?expired=1';
    }
  }

  if (!res.ok || body.success === false) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}

// ============== Auth API ==============
const authApi = {
  login: async (username, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    TokenStore.set(res.data.token);
    TokenStore.setUser(res.data.user);
    return res;
  },
  logout: () => { TokenStore.clear(); sessionStorage.removeItem('htx_user'); },
  me: () => request('/auth/me'),
  isLoggedIn: () => !!TokenStore.get(),
};

const api = {
  health: ()        => request('/health'),
  list:   (params)  => {
    const qs = new URLSearchParams(params || {}).toString();
    return request('/products' + (qs ? '?' + qs : ''));
  },
  get:    (id)      => request('/products/' + id),
  categories: ()    => request('/products/categories/list'),
  create: (data)    => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, d)   => request('/products/' + id, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id)      => request('/products/' + id, { method: 'DELETE' })
};

/* ===== Toast ===== */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container')
    || (() => {
        const el = document.createElement('div');
        el.id = 'toast-container';
        el.className = 'toast-container';
        document.body.appendChild(el);
        return el;
      })();

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ===== Format tiền VND ===== */
function formatVND(n) {
  return Number(n).toLocaleString('vi-VN') + ' ₫';
}

/* ===== Escape HTML ===== */
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
