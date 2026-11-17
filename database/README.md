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

## Dữ liệu demo

File `demo-data.sql` tạo dữ liệu mẫu để demo (chạy **sau** `schema.sql`):

1. MySQL Workbench → `File → Open SQL Script…` → chọn `database/demo-data.sql`
2. Bấm **Execute** (⚡) → bảng kết quả cuối cùng hiển thị 4 tài khoản demo

| Tài khoản | Vai trò | Ghi chú |
|---|---|---|
| `minhanh.demo@example.com` | STUDENT | Nguyễn Minh Anh – Văn Lang, CNTT |
| `quochuy.demo@example.com` | STUDENT | Trần Quốc Huy – Văn Lang, QTKD |
| `songmay.demo@example.com` | EMPLOYER | Cà phê Sông Mây – 3 tin tuyển dụng |
| `anhduong.demo@example.com` | EMPLOYER | Trung tâm Gia sư Ánh Dương – 3 tin tuyển dụng |

Mật khẩu chung: `Demo@2026` (chỉ dùng cho tài khoản demo, lưu dạng BCrypt).

6 tin tuyển dụng `OPEN` thuộc 4 ngành nghề (Dịch vụ ăn uống, Bán lẻ, Giáo dục, Văn phòng),
2 khu vực (TP. Hồ Chí Minh, Hà Nội) và nhiều mức thù lao để demo tìm kiếm / lọc.
Không tạo sẵn đơn ứng tuyển – ứng tuyển, duyệt / từ chối và hoàn thành công việc được thực hiện trực tiếp khi demo.

File chỉ dùng `INSERT` có kiểm tra `NOT EXISTS`: an toàn khi chạy lại, không tạo trùng và không thay đổi dữ liệu đã có.

## Sprint 4 – Khung giờ làm việc (`sprint4-job-work-time.sql`)

Thêm 2 cột vào `job_posts` để sinh viên lọc việc theo giờ rảnh (ví dụ 17:00 – 19:00):

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `start_time` | `TIME`, cho phép `NULL` | Giờ bắt đầu ca làm |
| `end_time` | `TIME`, cho phép `NULL` | Giờ kết thúc ca làm |

Ràng buộc `chk_job_posts_work_time`: cả hai cùng `NULL` (giờ linh hoạt) hoặc cả hai có giá trị
và `end_time > start_time`. Chưa hỗ trợ ca qua nửa đêm.

Cách chạy (MySQL Workbench → `File → Open SQL Script…` → Execute ⚡):

- CSDL đang dùng: chỉ chạy `sprint4-job-work-time.sql`
- CSDL mới: `schema.sql` → `demo-data.sql` → `sprint4-job-work-time.sql`

File chỉ thêm cột / ràng buộc khi chưa có, điền giờ cho 5 tin demo đang để trống giờ và thêm
1 nhà tuyển dụng demo (`saoviet.demo@example.com`, mật khẩu `Demo@2026`) cùng 5 tin mới.
Không `DROP`, không `DELETE`; chạy lại nhiều lần không tạo trùng.
