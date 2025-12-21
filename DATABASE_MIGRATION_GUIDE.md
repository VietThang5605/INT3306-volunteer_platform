# Hướng Dẫn Di Chuyển Dự Án Sang Máy Mới (An Toàn Nhất)

Tài liệu này hướng dẫn cách **Backup & Restore** database. Đây là cách **chuẩn và an toàn nhất** để chuyển dữ liệu Postgres giữa các máy, tránh lỗi "missing file" hoặc lỗi quyền hạn (permissions) thường gặp khi copy folder `pgdata` trực tiếp.

## Quyền Lợi Của Cách Này
- **An toàn tuyệt đối:** Không lo lỗi thiếu file hệ thống của Postgres.
- **Tương thích:** Chuyển từ Mac -> Windows -> Linux thoải mái.
- **Sạch sẽ:** Database máy mới luôn được khởi tạo chuẩn chỉnh.

---

## Phần 1: Tại Máy Cũ (Tạo Backup)

**Bước 1:** Mở terminal tại thư mục dự án trên máy đang chạy.

**Bước 2:** Chạy lệnh sau để xuất toàn bộ dữ liệu ra file `backup.sql`.
*(Lệnh này đùng Docker Compose để tự tìm container và xuất dữ liệu)*

```bash
# Lưu ý: Nếu user/db trong .env khác 'postgres', hãy thay thế tương ứng.
docker compose exec -T db pg_dump -U postgres -d postgres > backup.sql
```

**Kết quả:** Bạn sẽ thấy file `backup.sql` xuất hiện trong thư mục code.

---

## Phần 2: Di Chuyển (Sang Máy Mới)

1.  Copy toàn bộ thư mục **Code** (src, package.json, docker-compose.yml...) sang máy mới.
2.  Copy file **`backup.sql`** vừa tạo sang thư mục dự án ở máy mới.
3.  **QUAN TRỌNG:** Ở máy mới, **XOÁ** thư mục `pgdata` cũ đi (nếu có). Để Docker tự tạo cái mới sạch sẽ.

---

## Phần 3: Tại Máy Mới (Restore Dữ Liệu)

**Bước 1:** Khởi động dự án ở chế độ build mới.
```bash
docker-compose up --build -d
```
*Chờ khoảng 10-20 giây để Database khởi động hoàn tất.*

**Bước 2:** Nạp dữ liệu từ file backup vào Database.
Chạy lệnh sau tại terminal của máy mới:

```bash
cat backup.sql | docker compose exec -T db psql -U postgres -d postgres
```

**Bước 3:** Kiểm tra lại (Tuỳ chọn).
Vào lại ứng dụng hoặc dùng PgAdmin để đảm bảo dữ liệu đã có đủ.

---

## Tóm Tắt Quy Trình 3 Lệnh

**Máy cũ:**
1. `docker compose exec -T db pg_dump -U postgres -d postgres > backup.sql`

**Máy mới:**
2. `docker-compose up --build -d`
3. `cat backup.sql | docker compose exec -T db psql -U postgres -d postgres`
