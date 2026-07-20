# MeetSync Backend

Cùng một API, hai lựa chọn lưu trữ:

| File | Lưu ở đâu | Cần cài gì |
|---|---|---|
| `server.js` | **Supabase (Postgres)** — mặc định | `npm install` (cần mạng) + tài khoản Supabase |
| `server.local.js` | File JSON (`data/db.json`) | Không cần cài gì, chạy `node server.local.js` luôn |

Cả hai đều expose đúng các route API giống nhau, nên frontend không cần đổi gì khi bạn chuyển qua lại.

## Chạy với Supabase (khuyên dùng — dữ liệu được lưu thật, không mất khi restart)

1. Tạo project tại [supabase.com](https://supabase.com) (miễn phí).
2. Vào **SQL Editor** trong dashboard → dán toàn bộ nội dung file `../supabase/schema.sql` → **Run**.
   Việc này tạo 2 bảng `employees`, `meetings` và chèn sẵn dữ liệu mẫu.
3. Vào **Project Settings → API**, copy:
   - **Project URL**
   - **service_role key** (không phải anon key — cần quyền ghi dữ liệu)
4. Trong thư mục `backend/`:
   ```bash
   cp .env.example .env
   # mở .env, dán URL và service_role key vào
   npm install
   npm start
   ```
5. Backend chạy ở `http://localhost:3001`. Frontend (`npm run dev` ở thư mục gốc) sẽ tự động gọi qua proxy `/api`.

## Chạy nhanh không cần Supabase (demo / offline)

```bash
node server.local.js
```

Dữ liệu lưu trong `data/db.json`, mất/reset dữ liệu mỗi khi bạn xoá file này. Phù hợp để demo nhanh khi chưa có tài khoản Supabase.

## Lưu ý bảo mật

- `.env` chứa `service_role key` — **không commit lên Git**, không nhúng vào frontend.
- File `.env` đã được thêm vào `.gitignore` ở thư mục gốc.
