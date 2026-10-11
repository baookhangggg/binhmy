# 🚀 DEPLOY TỰ ĐỘNG - HTX BÌNH MỸ

## Chỉ cần 2 bước (mỗi bước ~30 giây)

### Bước 1: Bật GitHub Pages (TỰ ĐỘNG - 1 click)

1. Mở link này: **https://github.com/baookhangggg/binhmy/settings/pages**
2. Phần **"Source"** chọn: **`GitHub Actions`**
3. Đợi 1-2 phút → có badge ✅ màu xanh ở tab **Actions**

✅ **Xong bước 1** — Website đã chạy tại: **`https://baookhangggg.github.io/binhmy/`**
(Lúc này trang sẽ hiện nhưng phần "Sản phẩm" sẽ báo lỗi vì chưa có backend)

### Bước 2: Deploy Backend lên Render (TỰ ĐỘNG - 1 click)

1. Mở link này: **https://render.com/deploy?repo=https://github.com/baookhangggg/binhmy**
2. Đăng nhập/đăng ký Render bằng GitHub (1 lần duy nhất)
3. Render sẽ **TỰ ĐỘNG** đọc file `render.yaml` và tạo service với mọi cấu hình sẵn:
   - ✅ Node runtime
   - ✅ Singapore region
   - ✅ Free plan
   - ✅ Tự sinh JWT_SECRET mạnh
   - ✅ Sẵn sàng CORS với GitHub Pages
   - ✅ Default admin: `admin` / `HTXBinhMy@2026`
4. Bấm **"Apply"** → đợi 3-5 phút
5. Khi xong, copy URL service (ví dụ: `https://htx-binh-my-api.onrender.com`)

### Bước 3: Cập nhật URL cho frontend (30 giây)

1. Mở: **https://github.com/baookhangggg/binhmy/edit/main/public/js/config.js**
2. Sửa dòng đầu tiên thành URL Render của bạn:
   ```js
   const API_BASE = 'https://htx-binh-my-api.onrender.com/api';
   ```
3. Bấm **"Commit changes"**

✅ **XONG!** Truy cập **`https://baookhangggg.github.io/binhmy/`** để xem.

---

## 📋 Checklist nhanh

- [ ] **Bước 1**: Mở link Pages → chọn `GitHub Actions` → Save
- [ ] **Bước 2**: Mở link Render → Apply → đợi build
- [ ] **Bước 3**: Sửa `config.js` → Commit
- [ ] 🎉 Truy cập website!

---

## 🔑 Thông tin đăng nhập Admin

- **URL Admin**: `https://baookhangggg.github.io/binhmy/admin.html`
- **Username**: `admin`
- **Password**: `HTXBinhMy@2026`

⚠️ **Nhớ đổi mật khẩu ngay** lần đầu đăng nhập!

---

## 🆘 Nếu lỗi

### GitHub Pages không deploy
- Vào tab **Actions** trong repo, xem log
- Thường mất 1-2 phút lần đầu

### Render build fail
- Vào Dashboard Render → service của bạn → tab **Logs**
- Thường do: thiếu dependencies → kiểm tra `package.json`

### Frontend báo "Không tải được sản phẩm"
- Mở F12 → Console xem lỗi
- Kiểm tra `config.js` đúng URL Render chưa
- Render free tier ngủ 15 phút → lần đầu chậm ~30s
