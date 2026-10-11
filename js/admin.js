/* ============================================
 * HTX Bình Mỹ - Trang quản lý sản phẩm
 * ============================================ */

const state = {
  products: [],
  categories: [],
  filter: { q: '', category: '' },
  editing: null
};

const $ = sel => document.querySelector(sel);

const fmt = formatVND;

// ========== Render ==========
function renderProducts() {
  const list = $('#product-list');
  if (state.products.length === 0) {
    list.innerHTML = `
      <div class="empty" style="grid-column: 1/-1;">
        <div class="icon">🌾</div>
        <h3>Chưa có sản phẩm</h3>
        <p>Nhấn "+ Thêm sản phẩm" để bắt đầu</p>
      </div>`;
    return;
  }

  list.innerHTML = state.products.map(p => `
    <div class="product-card">
      <div class="emoji">${esc(p.image || '📦')}</div>
      <h3>${esc(p.name)}</h3>
      <span class="category-tag">${esc(p.category)}</span>
      ${p.vietgap ? '<span class="badge-vietgap">✅ VietGAP</span>' : ''}
      <div class="price">${fmt(p.price)}</div>
      <div class="desc">${esc(p.description || '')}</div>
      <div style="font-size:12px;color:var(--text-light);margin-bottom:8px;">
        📦 Tồn kho: ${p.stock || 0} ${esc(p.unit || '')}
      </div>
      <div class="product-actions">
        <button class="btn-secondary" onclick="openEdit(${p.id})">✏️ Sửa</button>
        <button class="btn-danger" onclick="deleteProduct(${p.id})">🗑 Xoá</button>
      </div>
    </div>
  `).join('');
}

function renderCategoryOptions() {
  const select = $('#filter-category');
  const opts = ['<option value="">Tất cả danh mục</option>']
    .concat(state.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`));
  select.innerHTML = opts.join('');
  select.value = state.filter.category;

  // Đồng thời cập nhật danh sách trong form
  const formSelect = $('#form-category');
  if (formSelect) {
    formSelect.innerHTML = state.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }
}

// ========== API calls ==========
async function loadAll() {
  $('#product-list').innerHTML = `
    <div class="loading" style="grid-column:1/-1;">
      <div class="spinner"></div>
      <p>Đang tải sản phẩm...</p>
    </div>`;

  try {
    const [listRes, catRes] = await Promise.all([
      api.list({ q: state.filter.q, category: state.filter.category }),
      api.categories()
    ]);
    state.products = listRes.data;
    state.categories = catRes.data;
    renderProducts();
    renderCategoryOptions();
  } catch (err) {
    showToast('Lỗi tải dữ liệu: ' + err.message, 'error');
    $('#product-list').innerHTML = `
      <div class="empty" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>
        <h3>Không kết nối được API</h3>
        <p>${esc(err.message)}</p>
        <p style="margin-top:12px;">Đảm bảo bạn đã chạy <code>npm start</code></p>
      </div>`;
  }
}

async function deleteProduct(id) {
  if (!confirm('Bạn chắc chắn muốn xoá sản phẩm này?')) return;
  try {
    await api.remove(id);
    showToast('Đã xoá sản phẩm');
    loadAll();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// ========== Modal ==========
function openModal() {
  $('#modal').classList.add('show');
}
function closeModal() {
  $('#modal').classList.remove('show');
  state.editing = null;
  $('#modal-title').textContent = '+ Thêm sản phẩm';
  $('#product-form').reset();
}

function openCreate() {
  state.editing = null;
  $('#modal-title').textContent = '+ Thêm sản phẩm';
  $('#product-form').reset();
  openModal();
}

async function openEdit(id) {
  try {
    const res = await api.get(id);
    state.editing = res.data;
    $('#modal-title').textContent = '✏️ Sửa sản phẩm';
    const f = $('#product-form');
    f.name.value        = res.data.name;
    f.category.value    = res.data.category;
    f.price.value       = res.data.price;
    f.unit.value        = res.data.unit;
    f.description.value = res.data.description || '';
    f.stock.value       = res.data.stock;
    f.image.value       = res.data.image || '';
    f.vietgap.checked   = !!res.data.vietgap;
    openModal();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(),
    category: f.category.value.trim() || (f['new-category'] && f['new-category'].value.trim()),
    price: Number(f.price.value),
    unit: f.unit.value.trim() || 'kg',
    description: f.description.value.trim(),
    stock: Number(f.stock.value || 0),
    vietgap: f.vietgap.checked,
    image: f.image.value.trim() || '📦'
  };
  if (!data.name || !data.category || isNaN(data.price)) {
    showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
    return;
  }
  try {
    if (state.editing) {
      await api.update(state.editing.id, data);
      showToast('Đã cập nhật sản phẩm');
    } else {
      await api.create(data);
      showToast('Đã thêm sản phẩm mới');
    }
    closeModal();
    loadAll();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// ========== Init ==========
document.addEventListener('DOMContentLoaded', () => {
  $('#filter-q').addEventListener('input', e => {
    state.filter.q = e.target.value;
    loadAll();
  });
  $('#filter-category').addEventListener('change', e => {
    state.filter.category = e.target.value;
    loadAll();
  });
  $('#product-form').addEventListener('submit', handleSubmit);

  loadAll();
});

// Expose for inline handlers
window.openCreate = openCreate;
window.openEdit = openEdit;
window.closeModal = closeModal;
window.deleteProduct = deleteProduct;
