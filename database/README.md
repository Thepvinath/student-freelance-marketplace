# Database – Student Freelance Marketplace

CSDL: **MySQL 8.0**, tên schema: `student_freelance_marketplace`

## Tạo CSDL

1. Mở **MySQL Workbench** → kết nối `localhost:3306`
2. `File → Open SQL Script…` → chọn `database/schema.sql`
3. Bấm **Execute** (⚡)
4. Kết quả `SHOW TABLES` phải có đủ **7 bảng**

File `schema.sql` an toàn khi chạy lại: chỉ dùng `CREATE ... IF NOT EXISTS`,
không có `DROP TABLE`, không xóa dữ liệu.

## Các bảng

| Bảng | Mô tả | FR |
|---|---|---|
| `users` | Tài khoản (STUDENT / EMPLOYER / ADMIN), mật khẩu BCrypt | FR-01, FR-02, FR-03 |
| `student_profiles` | Hồ sơ sinh viên, khóa chính = `users.id` | FR-04 |
| `employer_profiles` | Hồ sơ nhà tuyển dụng, khóa chính = `users.id` | FR-04 |
| `job_posts` | Tin tuyển dụng, trạng thái `OPEN / FILLED / COMPLETED` | FR-05, FR-06, FR-09 |
| `applications` | Đơn ứng tuyển `PENDING / APPROVED / REJECTED`, mỗi sinh viên 1 đơn / 1 tin | FR-07, FR-08 |
| `reviews` | Đánh giá 1–5 sao sau khi hoàn thành công việc | FR-10 |
| `notifications` | Thông báo khi trạng thái ứng tuyển thay đổi | FR-11 |

## Kết nối Backend

Backend (Spring Boot) **không tự tạo bảng** (`spring.jpa.hibernate.ddl-auto=none`),
vì vậy phải chạy `schema.sql` trước. Thông tin đăng nhập MySQL lấy từ biến môi trường:

```
DB_USER, DB_PASSWORD, JWT_SECRET
```

Không ghi mật khẩu thật vào file trong repository.
