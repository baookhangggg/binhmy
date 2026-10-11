# HTX Nông nghiệp Bình Mỹ - Website + Backend

Dự án gồm:
- **Backend**: Node.js + Express + SQLite (sql.js) - REST API
- **Frontend**: Trang tĩnh `index.html` (bạn đã có) + trang quản lý sản phẩm mới

## 1. Cài đặt

Yêu cầu đã cài **Node.js 18+** ([tải tại đây](https://nodejs.org)).

```bash
# Di chuyển vào thư mục dự án
cd website_binhmy

# Cài đặt dependencies
npm install

# Chạy server (mặc định port 3000)
npm start
```

Mở trình duyệt: http://localhost:3000

## 2. Cấu trúc thư mục

```
website_binhmy/
├── package.json              # Cấu hình npm
├── server.js                 # Express server + REST API
├── db.js                     # Khởi tạo SQLite, seed dữ liệu
├── data/
│   └── htx-binhmy.db         # File SQLite (tự tạo khi chạy)
├── public/                   # Frontend tĩnh
│   ├── index.html            # Trang chính (move từ root)
│   ├── admin.html            # Trang quản lý sản phẩm
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js            # Helper gọi API
│       └── admin.js          # Logic trang admin
├── README.md
└── .gitignore
```

## 3. REST API

Tất cả API trả về dạng:
```json
{ "success": true, "data": {...}, "count": 8 }
```

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET    | `/api/health` | Health check |
| GET    | `/api/products?q=&category=` | Danh sách sản phẩm (có search/filter) |
| GET    | `/api/products/:id` | Chi tiết một sản phẩm |
| GET    | `/api/products/categories/list` | Danh sách category |
| POST   | `/api/products` | Tạo sản phẩm |
| PUT    | `/api/products/:id` | Cập nhật sản phẩm |
| DELETE | `/api/products/:id` | Xoá sản phẩm |

### Ví dụ `POST /api/products`

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dưa hấu Bình Mỹ",
    "category": "Trái cây",
    "price": 25000,
    "unit": "trái",
    "description": "Dưa hấu ruột đỏ, ngọt mát",
    "stock": 100,
    "vietgap": true,
    "image": "🍉"
  }'
```

## 4. Trang quản lý sản phẩm

Truy cập: http://localhost:3000/admin.html

Cho phép:
- Xem danh sách sản phẩm (load từ API)
- Thêm / sửa / xoá sản phẩm
- Lọc theo category, tìm kiếm theo tên

## 5. Cổng & biến môi trường

```bash
PORT=4000 npm start
```

## 6. Backup dữ liệu

Sao chép file `data/htx-binhmy.db` để backup toàn bộ sản phẩm.
