# MeetSync — Hệ thống Quản lý Cuộc họp

Web dashboard quản lý cuộc họp nội bộ (module Trưởng phòng): tạo cuộc họp, duyệt/từ chối yêu cầu, phân công người tham gia, xem lịch, báo cáo thống kê.

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend**: Node.js thuần (không phụ thuộc framework), 2 chế độ lưu trữ:
  - `backend/server.js` → **Supabase (Postgres)** — mặc định, dữ liệu lưu thật
  - `backend/server.local.js` → file JSON (`backend/data/db.json`) — chạy nhanh không cần Supabase

## Cấu trúc thư mục

```
.
├── src/                    # Frontend (React)
│   ├── App.tsx             # Toàn bộ UI + gọi API
│   └── ...
├── backend/                # Backend (Node.js)
│   ├── server.js           # Bản Supabase (mặc định)
│   ├── server.local.js     # Bản file JSON (demo nhanh)
│   ├── data/db.json        # Dữ liệu mẫu cho bản local
│   ├── .env.example        # Mẫu cấu hình Supabase
│   └── README.md           # Chi tiết cách chạy backend
├── supabase/
│   └── schema.sql           # Script tạo bảng + seed dữ liệu cho Supabase
└── vite.config.ts           # Đã cấu hình proxy /api → backend (cổng 3001)
```

## Chạy thử nhanh (không cần Supabase)

```bash
# Backend — dùng file JSON, không cần cài gì
cd backend
node server.local.js

# Frontend (terminal khác, ở thư mục gốc)
npm install
npm run dev
```

Mở trình duyệt ở địa chỉ Vite in ra (mặc định http://localhost:8443).

## Chạy với Supabase (khuyên dùng cho môi trường thật)

1. Tạo project miễn phí tại [supabase.com](https://supabase.com).
2. Vào **SQL Editor** → dán nội dung `supabase/schema.sql` → **Run** (tạo bảng + dữ liệu mẫu).
3. Vào **Project Settings → API** → copy **Project URL** và **service_role key**.
4. ```bash
   cd backend
   cp .env.example .env     # điền URL + key vào
   npm install
   npm start
   ```
5. Terminal khác: `npm install && npm run dev` ở thư mục gốc.

Chi tiết hơn xem `backend/README.md`.

## API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/meetings` | Danh sách cuộc họp (lọc theo `status`, `from`, `to`, `room`, `search`) |
| GET | `/api/meetings/:id` | Chi tiết 1 cuộc họp |
| POST | `/api/meetings` | Tạo cuộc họp mới |
| POST | `/api/meetings/:id/approve` | Duyệt |
| POST | `/api/meetings/:id/reject` | Từ chối (body: `{ reason }`) |
| PUT | `/api/meetings/:id/participants` | Cập nhật người tham gia (body: `{ participants: number[] }`) |
| DELETE | `/api/meetings/:id` | Xoá cuộc họp |
| GET | `/api/employees` | Danh sách nhân viên |
| GET | `/api/stats` | Thống kê tổng quan |
| POST | `/api/login` | Đăng nhập demo (mật khẩu mẫu: `123456`) |

## Ghi chú bảo mật

- `backend/.env` chứa `service_role key` của Supabase — **không commit lên Git** (đã có trong `.gitignore`).
- Đây là dự án demo/đồ án học tập — cơ chế đăng nhập chỉ mang tính minh hoạ, chưa mã hoá mật khẩu thật.
