# Hướng Dẫn Chạy Dự Án Trên Máy Khác (Docker)

Tài liệu này hướng dẫn cách di chuyển và chạy dự án trên một máy tính mới mà vẫn giữ nguyên dữ liệu database.

## 1. Chuẩn Bị Trước Khi Copy

Đảm bảo cấu trúc dự án của bạn đang ở trạng thái như sau:
- Source code đầy đủ.
- Thư mục `pgdata` nằm ở thư mục gốc (chứa dữ liệu Postgres).
- File `docker-compose.yml` đã được cấu hình bind mound (`./pgdata:/var/lib/postgresql/data`).

## 2. Các Bước Thực Hiện Trên Máy Mới

### Bước 1: Copy Dự Án
Copy toàn bộ thư mục dự án sang máy mới, **bao gồm cả thư mục `pgdata`**.
Trong thư mục mới sẽ có:
- `src/`
- `docker-compose.yml`
- `package.json`
- `pgdata/` (QUAN TRỌNG: Đây là nơi chứa dữ liệu DB của bạn)
- ...

### Bước 2: Cài Đặt Môi Trường
Máy mới cần cài sẵn:
- **Docker** và **Docker Compose**.

### Bước 3: Cấu Hình Biến Môi Trường (.env)
File `.env` thường không được copy theo nếu bạn dùng git clone (do nằm trong `.gitignore`).
Bạn cần tạo file `.env` tại thư mục gốc và điền các biến môi trường tương tự máy cũ.
Ví dụ:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@db:5432/dbname
# Các key khác...
```
*Lưu ý: Nếu bạn copy trực tiếp cả folder qua USB/LAN thì file .env có thể đã có sẵn.*

### Bước 4: Khởi Động Docker
Mở terminal tại thư mục dự án và chạy:

```bash
docker-compose up -d
```
Lệnh này sẽ:
- Tải các image cần thiết (postgres, node, pgadmin...).
- Start các container.
- Mount thư mục `pgdata` hiện có vào database container => **Dữ liệu cũ sẽ được load lên.**

### Bước 5: Cập Nhật Prisma Client (Bắt Buộc)
Vì folder `node_modules` thường không copy theo (hoặc khác hệ điều hành), code sẽ thiếu Prisma Client để giao tiếp với DB. Bạn cần chạy lệnh sau:

```bash
docker compose exec app npx prisma generate
```

### Bước 6: Kiểm Tra (Optional)
Để chắc chắn mọi thứ đồng bộ (thường bước này chỉ cần thiết nếu bạn thay đổi schema mà chưa migrate), bạn có thể chạy:
```bash
docker compose exec app npx prisma migrate dev
```
Nếu database đã khớp code, nó sẽ báo "Already in sync".

## Tóm Tắt Lệnh Cần Chạy
```bash
# 1. Start project
docker-compose up -d

# 2. Generate client (chỉ cần làm lần đầu sang máy mới)
docker compose exec app npx prisma generate
```
