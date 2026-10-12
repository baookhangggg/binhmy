/* ============================================================
 * HTX Bình Mỹ — Shared Store
 * Một nguồn dữ liệu duy nhất cho 3 cổng:
 *   - /nong-dan/  (data-role="nongDan")
 *   - /htx/       (data-role="htx")
 *   - /doanh-nghiep/ (data-role="doanhNghiep")
 * Cập nhật dữ liệu: sửa /data/store.json, 3 cổng tự đồng bộ.
 * ============================================================ */
(function () {
  'use strict';

  const STORE_URL = '../data/store.json';
  // data-role khớp với key trong store.json: nongDan / htx / doanhNghiep
  const ROLE = document.body.getAttribute('data-role') || '';

  /* ---------- helpers ---------- */
  const fmtVND = (n) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + ' triệu';
    if (n >= 1_000)         return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toString();
  };
  const fmtNumber = (n) => n.toLocaleString('vi-VN');
  const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  const trendIcon = (t) => ({ up: '↑', down: '↓', stable: '→' }[t] || '·');
  const trendClass = (t) => ({ up: 'up', down: 'down', stable: 'stable' }[t] || 'stable');

  /* ---------- fetch store ---------- */
  function loadStore() {
    return fetch(STORE_URL, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  /* ============================================================
   * RENDERERS — mỗi hàm render cho 1 section; chỉ chạy khi section
   * tồn tại trong DOM. Nếu section không tồn tại thì bỏ qua.
   * ============================================================ */

  // Hero (greeting + stats)
  function renderHero(s) {
    const hero = document.querySelector('[data-store="hero"]');
    if (!hero) return;
    const stats = (s.stats && s.stats[ROLE]) || s.stats?.htx || {};
    const {
      farmerName, today, activeFields, totalArea, monthlyIncome, seasonYield,
      members, monthlyVolume, partners, totalArea: htxArea,
      companyName, monthlyValue, savingsPercent, openOrders, vietgapRate
    } = stats;

    let greeting = 'HTX Bình Mỹ';
    let sub = 'Nền tảng nông nghiệp số — đồng bộ dữ liệu 3 cổng';
    let tiles = [];

    if (ROLE === 'nongDan') {
      greeting = `👨‍🌾 Chào ${farmerName || 'bà con'}, hôm nay ${today || ''}`;
      sub = 'Theo dõi mùa vụ, ghi nhật ký VietGAP tự động và nhận đơn bao tiêu từ doanh nghiệp — tất cả ở một nơi.';
      tiles = [
        { v: (activeFields || 0) + ' lô',   l: 'Đang canh tác' },
        { v: fmtNumber(totalArea || 0) + ' m²', l: 'Diện tích' },
        { v: fmtVND(monthlyIncome || 0),   l: 'Thu nhập tháng' },
        { v: fmtNumber(seasonYield || 0) + ' kg', l: 'Sản lượng vụ' }
      ];
    } else if (ROLE === 'htx') {
      greeting = '🏭 HTX Bình Mỹ — Cổng Quản lý';
      sub = 'Quản lý ' + (members || 0) + ' xã viên, ' + (htxArea || 0) + ' ha, kết nối doanh nghiệp bao tiêu toàn quốc.';
      tiles = [
        { v: (members || 0) + ' xã viên',  l: 'Thành viên' },
        { v: (htxArea || 0) + ' ha',       l: 'Diện tích' },
        { v: (monthlyVolume || 0) + ' tấn', l: 'Sản lượng tháng' },
        { v: (partners || 0) + ' DN',      l: 'Đối tác' }
      ];
    } else if (ROLE === 'doanhNghiep') {
      greeting = `🏢 Chào ${companyName || 'Quý đối tác'}`;
      sub = 'Tìm nguồn cung nông sản VietGAP từ HTX Bình Mỹ — đặt đơn trực tiếp, theo dõi giao nhận và truy xuất nguồn gốc minh bạch.';
      tiles = [
        { v: (monthlyVolume || 0) + ' tấn', l: 'Đã mua tháng này' },
        { v: (openOrders || 0),            l: 'Đơn đang giao' },
        { v: (vietgapRate || 0) + '%',     l: 'VietGAP đạt chuẩn' },
        { v: '-' + (savingsPercent || 0) + '%', l: 'Chi phí vs chợ đầu mối' }
      ];
    } else {
      tiles = [
        { v: (members || 0) + ' xã viên', l: 'Thành viên' },
        { v: fmtVND(monthlyValue || 0),    l: 'Giá trị tháng' },
        { v: (s.htx?.members || 0),        l: 'Sản phẩm' },
        { v: 'VietGAP',                    l: 'Chứng nhận' }
      ];
    }

    hero.querySelector('[data-store="heroTitle"]').textContent = greeting;
    hero.querySelector('[data-store="heroSub"]').textContent = sub;
    const statsEl = hero.querySelector('[data-store="heroStats"]');
    if (statsEl) {
      statsEl.innerHTML = tiles.map((t) => `
        <div class="stat"><div class="v">${escapeHTML(t.v)}</div><div class="l">${escapeHTML(t.l)}</div></div>
      `).join('');
    }
  }

  // Danh sách sản phẩm (grid card)
  function renderProducts(s) {
    const root = document.querySelector('[data-store="products"]');
    if (!root || !Array.isArray(s.products)) return;
    const list = s.products.map((p) => {
      const certs = (p.certification || []).map((c) => {
        const cls = c === 'VietGAP' ? 'pill-green' : (c === 'Hữu cơ' ? 'pill-blue' : 'pill-gray');
        return `<span class="pill ${cls}">${escapeHTML(c)}</span>`;
      }).join('');
      const statusCls = p.status === 'Có sẵn' ? 'pill-green' : 'pill-amber';
      const stockTxt = p.stock > 0
        ? `Tồn kho: ${fmtNumber(p.stock)} ${p.unit} · MOQ: ${fmtNumber(p.moq)} ${p.unit}`
        : `Đặt trước · MOQ: ${fmtNumber(p.moq)} ${p.unit}`;
      const btnText = p.status === 'Có sẵn' ? '+ Đặt mua' : '+ Đặt trước';
      return `
        <div class="card" data-product-id="${escapeHTML(p.id)}">
          <div style="font-size:42px; text-align:center;">${p.icon || '🥬'}</div>
          <h3 style="font-size:17px; margin: 6px 0 4px;">${escapeHTML(p.name)}</h3>
          <p class="sub" style="margin: 0 0 10px;">${escapeHTML(p.origin)} · ${escapeHTML(p.harvest)}</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom: 12px;">
            ${certs}
            <span class="pill ${statusCls}">${escapeHTML(p.status)}</span>
          </div>
          <div style="font-size:20px; font-weight:800; color: var(--p-primary);">${fmtNumber(p.price)} ₫/${p.unit}</div>
          <div style="font-size:12px; color: var(--p-muted); margin: 4px 0 12px;">${stockTxt}</div>
          <button class="btn-primary" type="button" style="width:100%;">${btnText}</button>
        </div>
      `;
    }).join('');
    root.innerHTML = list;
  }

  // Đơn hàng
  function renderOrders(s) {
    const root = document.querySelector('[data-store="orders"]');
    if (!root || !Array.isArray(s.orders)) return;
    root.innerHTML = s.orders.map((o) => {
      const badge =
        o.statusKey === 'shipping'   ? '<span class="pill pill-blue">Vận chuyển</span>' :
        o.statusKey === 'delivered'  ? '<span class="pill pill-green">Đã nhận</span>' :
        o.statusKey === 'negotiating'? '<span class="pill pill-amber">Đàm phán</span>' :
        `<span class="pill pill-gray">${escapeHTML(o.status)}</span>`;
      const driver = o.driver ? ` · Tài xế ${escapeHTML(o.driver)} — ${escapeHTML(o.driverPhone || '')}` : '';
      return `
        <div class="list-item">
          <div class="dot ${o.statusKey === 'delivered' ? '' : (o.statusKey === 'shipping' ? 'amber' : 'red')}"></div>
          <div class="body">
            <h4>Đơn #${escapeHTML(o.id)} ${badge}</h4>
            <p>${escapeHTML(o.productName)} ${fmtNumber(o.quantity)} ${o.unit} · ${fmtVND(o.totalValue)} · Giao ${escapeHTML(o.deliveryDate)}${driver}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Lô truy xuất
  function renderLots(s) {
    const root = document.querySelector('[data-store="lots"]');
    if (!root || !Array.isArray(s.lots)) return;
    root.innerHTML = s.lots.map((l) => {
      const logs = (l.logs || []).map((g) => `
        <li>
          <div class="dot"></div>
          <div>
            <strong>${escapeHTML(g.label)}</strong> · <span class="when">${escapeHTML(g.date)}</span>
            <div class="sub" style="margin-top:2px;">${escapeHTML(g.detail)}</div>
          </div>
        </li>
      `).join('');
      return `
        <div class="card">
          <h3 style="font-size:17px; margin-bottom:4px;">${escapeHTML(l.productName)}</h3>
          <p class="sub" style="margin-bottom:12px;">Mã lô: <code>${escapeHTML(l.id)}</code> · ${fmtNumber(l.totalKg)} kg</p>
          <h4 style="font-size:14px; margin: 8px 0 10px;">📋 Nhật ký canh tác</h4>
          <ul class="timeline" style="list-style:none; padding:0; margin:0;">${logs}</ul>
        </div>
      `;
    }).join('');
  }

  // Giá thị trường (nông dân) — hỗ trợ 2 dạng: <table><tbody> hoặc <div class="list">
  function renderMarketPrices(s) {
    const root = document.querySelector('[data-store="marketPrices"]');
    if (!root || !Array.isArray(s.marketPrices)) return;
    const isTbody = root.tagName.toLowerCase() === 'tbody';
    if (isTbody) {
      root.innerHTML = s.marketPrices.map((m) => {
        const cls = trendClass(m.trend);
        const arrow = trendIcon(m.trend);
        const pillCls = m.trend === 'up' ? 'pill-green' : (m.trend === 'down' ? 'pill-red' : 'pill-amber');
        return `
          <tr>
            <td>${escapeHTML(m.name)}</td>
            <td><strong>${fmtNumber(m.price)} ₫/${m.unit}</strong></td>
            <td><span class="pill ${pillCls}">${arrow} ${escapeHTML(m.change)}</span></td>
            <td>Sở NN TP HCM</td>
            <td>${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `;
      }).join('');
    } else {
      root.innerHTML = s.marketPrices.map((m) => {
        const cls = trendClass(m.trend);
        const arrow = trendIcon(m.trend);
        return `
          <div class="list-item">
            <div class="dot ${m.trend === 'down' ? 'red' : (m.trend === 'stable' ? '' : 'amber')}"></div>
            <div class="body">
              <h4>${escapeHTML(m.name)}</h4>
              <p>${fmtNumber(m.price)} ₫/${m.unit}</p>
            </div>
            <div class="when price-${cls}">${arrow} ${escapeHTML(m.change)}</div>
          </div>
        `;
      }).join('');
    }
  }

  // Hoạt động gần đây (nông dân)
  function renderActivities(s) {
    const root = document.querySelector('[data-store="activities"]');
    if (!root || !Array.isArray(s.farmerActivities)) return;
    root.innerHTML = s.farmerActivities.map((a) => {
      const detail = a.area ? ` — ${escapeHTML(a.area)}` : (a.amount ? ` — ${escapeHTML(a.amount)}` : '');
      return `
        <div class="list-item">
          <div class="dot"></div>
          <div class="body">
            <h4>${a.icon} ${escapeHTML(a.label)}${detail}</h4>
            <p>${escapeHTML(a.when)}${a.lot ? ' · ' + escapeHTML(a.lot) : ''}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Tổng quan tile (nông dân / doanh nghiệp)
  function renderTiles(s) {
    const root = document.querySelector('[data-store="tiles"]');
    if (!root) return;
    const stats = (s.stats && s.stats[ROLE]) || s.stats?.htx || {};
    const data = ROLE === 'nongDan' ? [
      { icon: '🌱', v: (stats.activeFields || 0) + ' lô',          l: 'Đang canh tác',        d: '+1 lô mới' },
      { icon: '📐', v: fmtNumber(stats.totalArea || 0) + ' m²',     l: 'Diện tích',            d: 'Vụ Thu Đông 2026' },
      { icon: '💰', v: fmtVND(stats.monthlyIncome || 0),            l: 'Thu nhập tháng',       d: '↑ 18% so với T9' },
      { icon: '🌾', v: fmtNumber(stats.seasonYield || 0) + ' kg',   l: 'Sản lượng vụ',         d: 'Dự kiến 15/10' }
    ] : ROLE === 'doanhNghiep' ? [
      { icon: '🛒', v: fmtNumber(stats.monthlyVolume * 1000 || 0) + ' kg', l: 'Sản lượng đã mua (T10/2026)', d: '↑ 35% so với T9' },
      { icon: '💵', v: fmtVND(stats.monthlyValue || 0),                    l: 'Tổng chi tháng này',            d: 'Tiết kiệm 49 triệu vs chợ' },
      { icon: '✅', v: (stats.vietgapRate || 0) + '%',                     l: 'Đạt chuẩn VietGAP',             d: 'Đã kiểm 12/12 lô' },
      { icon: '🚚', v: (stats.openOrders || 0),                           l: 'Đơn đang vận chuyển',           d: 'Giao trong 3 ngày tới' }
    ] : [];
    if (!data.length) return;
    root.innerHTML = data.map((t) => `
      <div class="tile">
        <div class="icon">${t.icon}</div>
        <div>
          <div class="v">${escapeHTML(t.v)}</div>
          <div class="l">${escapeHTML(t.l)}</div>
          <div class="delta">${escapeHTML(t.d)}</div>
        </div>
      </div>
    `).join('');
  }

  // Thông tin liên hệ (topbar, header brand)
  function renderContact(s) {
    const htx = s.htx || {};
    document.querySelectorAll('[data-store="phone"]').forEach((el) => el.textContent = htx.phone || '');
    document.querySelectorAll('[data-store="email"]').forEach((el) => el.textContent = htx.email || '');
    document.querySelectorAll('[data-store="zalo"]').forEach((el) => el.setAttribute('href', htx.zaloOA || '#'));
    document.querySelectorAll('[data-store="phoneHref"]').forEach((el) => el.setAttribute('href', 'tel:' + (htx.phone || '')));
    document.querySelectorAll('[data-store="emailHref"]').forEach((el) => el.setAttribute('href', 'mailto:' + (htx.email || '')));
    document.querySelectorAll('[data-store="htxName"]').forEach((el) => el.textContent = htx.name || 'HTX Bình Mỹ');
  }

  // Tổng hợp sản lượng theo category (HTX)
  function renderProductionByCategory(s) {
    const root = document.querySelector('[data-store="productionByCategory"]');
    if (!root || !Array.isArray(s.products)) return;
    // Tính tổng kg theo category
    const groups = {};
    s.products.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = { label: p.categoryLabel, items: [], stock: 0, planned: 0 };
      groups[p.category].items.push(p);
      groups[p.category].stock   += p.stock || 0;
      // Kế hoạch: tồn kho + MOQ * 4 (ước lượng cho cả vụ)
      groups[p.category].planned += (p.stock || 0) + (p.moq || 0) * 4;
    });
    const colorOf = { 'lua-gao': 'var(--p-primary)', 'rau-cu': '#d97706', 'trai-cay': '#0e7490' };
    const pillCls = { 'lua-gao': 'pill-green', 'rau-cu': 'pill-amber', 'trai-cay': 'pill-blue' };
    root.innerHTML = Object.keys(groups).map((k) => {
      const g = groups[k];
      const target = Math.max(g.planned, 1);
      const pct = Math.min(100, Math.round((g.stock / target) * 100));
      return `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="pill ${pillCls[k] || 'pill-gray'}">${escapeHTML(g.label)}</span>
            <span style="font-size:12px; color: var(--p-muted);">Vụ Thu 2026</span>
          </div>
          <div style="font-size:28px; font-weight:800; margin: 10px 0 4px;">${fmtNumber(g.stock)} kg</div>
          <div style="font-size:13px; color: var(--p-muted);">${g.items.length} mặt hàng</div>
          <div style="height:8px; background:#e5e7eb; border-radius:999px; margin-top:12px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background: ${colorOf[k] || 'var(--p-primary)'};"></div>
          </div>
          <div style="font-size:12px; color: var(--p-muted); margin-top:6px;">${pct}% tồn/kế hoạch (${fmtNumber(target)} kg)</div>
        </div>
      `;
    }).join('');
  }

  /* ============================================================
   * BOOT
   * ============================================================ */
  function boot() {
    loadStore()
      .then((s) => {
        renderContact(s);
        renderHero(s);
        renderTiles(s);
        renderProducts(s);
        renderProductionByCategory(s);
        renderOrders(s);
        renderLots(s);
        renderMarketPrices(s);
        renderActivities(s);
        // Đánh dấu đã đồng bộ
        document.documentElement.setAttribute('data-store-loaded', '1');
        document.dispatchEvent(new CustomEvent('store:loaded', { detail: s }));
      })
      .catch((err) => {
        console.error('[store] Không tải được dữ liệu:', err);
        // Không chặn UI: nội dung HTML tĩnh vẫn hiển thị
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
