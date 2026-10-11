# 🚀 Hướng dẫn Deploy HTX Bình Mỹ lên Internet

Dự án gồm 2 phần cần deploy riêng:
- **Backend** (Node.js + SQLite) → Deploy lên **Render.com** (miễn phí)
- **Frontend** (HTML/CSS/JS) → Deploy lên **GitHub Pages** (miễn phí)

---

## 📦 Phần 1: Deploy Backend lên Render.com

### Bước 1.1: Tạo tài khoản Render
- Vào **https://render.com** → đăng ký bằng GitHub

### Bước 1.2: Tạo Web Service mới
1. Vào Dashboard: **https://dashboard.render.com/**
2. Bấm **"New +"** → chọn **"Web Service"**
3. Kết nối repo GitHub: chọn **`baookhangggg/binhmy`**
4. Điền thông tin:

| Trường | Giá trị |
|---|---|
| **Name** | `htx-binh-my-api` |
| **Region** | Singapore (gần VN nhất) |
| **Branch** | `main` |
| **Root Directory** | (để trống) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && node build.js` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

### Bước 1.3: Cấu hình biến môi trường (Environment Variables)
Trong phần **"Environment Variables"**, thêm từng biến sau:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://baookhangggg.github.io` |
| `JWT_SECRET` | *(xem cách sinh bên dưới)* |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | *(đặt mật khẩu mạnh)* |
| `LOG_LEVEL` | `info` |

**Cách sinh JWT_SECRET mạnh:**
Mở PowerShell trên máy, chạy:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy kết quả (chuỗi hex 128 ký tự) dán vào `JWT_SECRET`.

### Bước 1.4: Deploy
- Bấm **"Create Web Service"**
- Đợi 3–5 phút để Render build & start
- Khi xong, bạn sẽ có URL dạng: **`https://htx-binh-my-api.onrender.com`**

### Bước 1.5: Kiểm tra backend
Mở browser: **`https://htx-binh-my-api.onrender.com/api/health`**
- ✅ Nếu thấy `{"status":"ok",...}` → thành công
- ❌ Nếu lỗi → kiểm tra tab "Logs" trong Render

### Bước 1.6: Cập nhật frontend config
Mở file **`public/js/config.js`** trong repo, sửa:
```js
const API_BASE = 'https://htx-binh-my-api.onrender.com/api';
```
(Sửa lại nếu bạn đặt tên khác trong Bước 1.2)

Commit & push lên GitHub.

---

## 🌐 Phần 2: Deploy Frontend lên GitHub Pages

### Bước 2.1: Bật GitHub Pages
1. Vào repo: **https://github.com/baookhangggg/binhmy**
2. Bấm **Settings** (tab trên cùng)
3. Menu trái → chọn **"Pages"**
4. Phần **"Source"**:
   - Bấm **"Deploy from a branch"**
   - Branch: chọn **`main`**
   - Folder: chọn **`/(root)`**
5. Bấm **"Save"**

### Bước 2.2: Đợi deploy (1–3 phút)
- Quay lại tab **"Pages"** → sẽ hiện dòng:
  > ✅ Your site is live at `https://baookhangggg.github.io/binhmy/`
- Bấm vào link đó để mở website.

---

## 🔗 Phần 3: Liên kết Backend ↔ Frontend

Sau khi cả 2 phần đã live:

1. **Sửa lại `CORS_ORIGIN` trên Render:**
   - Vào Render Dashboard → service `htx-binh-my-api`
   - Tab **Environment** → sửa `CORS_ORIGIN` = `https://baookhangggg.github.io`
   - Bấm **"Save Changes"** → Render tự restart

2. **Đảm bảo `public/js/config.js` đúng URL backend** (xem Bước 1.6)

3. **Test:**
   - Mở `https://baookhangggg.github.io/binhmy/`
   - Scroll xuống phần **"Sản phẩm VietGAP"**
   - Nếu thấy danh sách sản phẩm → thành công ✅

---

## 🔐 Đăng nhập trang Admin

Truy cập: **`https://baookhangggg.github.io/binhmy/admin.html`**

- Username: `admin` (hoặc giá trị bạn đặt trong `ADMIN_USERNAME`)
- Password: mật khẩu bạn đặt trong `ADMIN_PASSWORD`

---

## 📝 Lưu ý quan trọng

### ⚠️ Render Free tier
- **Ngủ sau 15 phút không có request** → lần truy cập đầu tiên sau đó sẽ chậm ~30s (cold start)
- **750 giờ chạy/tháng** (đủ dùng cho dự án nhỏ)
- **Không lưu file vĩnh viễn** (SQLite sẽ reset khi redeploy)

### 🛠 Nâng cấp nếu cần
- **Render Starter ($7/tháng):** không ngủ, persistent disk
- **Railway.app:** cũng có free tier, persistent storage
- **VPS riêng (DigitalOcean, Vultr):** toàn quyền kiểm soát

### 🔄 Update code
- Sửa code → `git push origin main`
- Render tự động redeploy
- GitHub Pages tự động cập nhật (có thể mất 1–2 phút)

---

## 🆘 Troubleshooting

### Lỗi CORS khi frontend gọi API
- Kiểm tra `CORS_ORIGIN` trên Render có đúng `https://baookhangggg.github.io` không
- Đảm bảo URL trong `public/js/config.js` đúng với URL Render

### Backend không start
- Vào Render → tab **Logs** xem lỗi gì
- Thường do: thiếu env var, hoặc `JWT_SECRET` không hợp lệ

### Frontend hiển thị "Không tải được sản phẩm"
- Mở DevTools (F12) → tab Console xem lỗi
- Kiểm tra URL trong `config.js` đúng chưa
- Đợi cold start của Render (~30s)

---

## ✅ Checklist hoàn thành

- [ ] Tạo Render Web Service
- [ ] Cấu hình env vars (đặc biệt `JWT_SECRET` mới)
- [ ] Backend live tại `https://htx-binh-my-api.onrender.com`
- [ ] `/api/health` trả về OK
- [ ] Bật GitHub Pages
- [ ] Frontend live tại `https://baookhangggg.github.io/binhmy/`
- [ ] Sản phẩm load được trên frontend
- [ ] Đăng nhập admin thành công

---

🎉 **Chúc bạn deploy thành công!**
