# Database – Student Freelance Marketplace

CSDL: **MySQL 8.0**, tên schema: `student_freelance_marketplace`

## Tạo CSDL

1. Mở **MySQL Workbench** → kết nối `localhost:3306`
2. `File → Open SQL Script…` → chọn `database/schema.sql`
3. Bấm **Execute** (⚡)
4. Kết quả `SHOW TABLES` phải có đủ **8 bảng**

File `schema.sql` an toàn khi chạy lại: chỉ dùng `CREATE ... IF NOT EXISTS`,
không có `DROP TABLE`, không xóa dữ liệu.

## Các bảng

| Bảng | Mô tả | FR |
|---|---|---|
| `users` | Tài khoản (STUDENT / EMPLOYER / ADMIN), mật khẩu BCrypt | FR-01, FR-02, FR-03 |
| `student_profiles` | Hồ sơ sinh viên, khóa chính = `users.id` | FR-04 |
| `employer_profiles` | Hồ sơ nhà tuyển dụng, khóa chính = `users.id` | FR-04 |
| `job_posts` | Tin tuyển dụng, trạng thái `OPEN / FILLED / COMPLETED`, loại hình `PART_TIME / FULL_TIME`, đơn vị thù lao `HOUR / SHIFT / MONTH`, duyệt tin `PENDING / APPROVED / REJECTED` | FR-05, FR-06, FR-09, FR-12 |
| `applications` | Đơn ứng tuyển `PENDING / APPROVED / REJECTED`, mỗi sinh viên 1 đơn / 1 tin | FR-07, FR-08 |
| `reviews` | Đánh giá 1–5 sao sau khi hoàn thành công việc | FR-10 |
| `notifications` | Thông báo khi trạng thái ứng tuyển thay đổi | FR-11 |
| `cv_files` | File CV (PDF ≤ 5 MB) sinh viên tải lên | FR-04, FR-07 |

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

## Sprint 5 – Loại hình công việc, đơn vị thù lao (`sprint5-employment-type.sql`)

Thêm 2 cột vào `job_posts`:

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `employment_type` | `ENUM('PART_TIME','FULL_TIME')`, mặc định `PART_TIME` | Bán thời gian / Toàn thời gian |
| `salary_unit` | `ENUM('HOUR','SHIFT','MONTH')`, mặc định `HOUR` | Thù lao /giờ, /buổi, /tháng |

Tin đang có nhận `PART_TIME` và `HOUR`; 4 tin demo trả theo buổi (gia sư, trợ giảng, chụp ảnh) được đổi thành `SHIFT`. File thêm 1 nhà tuyển dụng demo
(`lamson.demo@example.com`, mật khẩu `Demo@2026`) và **6 tin toàn thời gian**
(phần lớn 08:00 – 17:00, thứ Hai – thứ Sáu, lương theo tháng) ở TP. Hồ Chí Minh, Hà Nội,
Đà Nẵng, Cần Thơ, Đồng Nai để demo bộ lọc loại hình.

## Sprint 5 – Kiểm duyệt tin tuyển dụng (`sprint5-job-moderation.sql`)

Tin mới phải được **Quản trị viên** duyệt trước khi sinh viên nhìn thấy (FR-12).

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `moderation_status` | `ENUM('PENDING','APPROVED','REJECTED')`, mặc định `PENDING` | Chờ duyệt / Đã duyệt / Từ chối |
| `moderation_note` | `VARCHAR(500)`, cho phép `NULL` | Lý do từ chối |
| `reviewed_by` | `BIGINT` → `users.id`, cho phép `NULL` | ADMIN đã xử lý |
| `reviewed_at` | `DATETIME`, cho phép `NULL` | Thời điểm xử lý |

- Tin **đã có** trước khi chạy file vẫn hiển thị (`APPROVED`); chỉ tin đăng sau đó mới chờ duyệt.
- Tạo tài khoản ADMIN demo: `admin.demo@example.com` / `Demo@2026` (web không cho đăng ký ADMIN).
- Tin của tài khoản `*.demo@example.com` chưa từng được xét được coi là đã duyệt.
- Thêm khóa ngoại `fk_job_posts_reviewer` và chỉ mục `idx_job_posts_moderation`.

Cách chạy (MySQL Workbench → `File → Open SQL Script…` → Execute ⚡):

- CSDL đang dùng: `sprint5-employment-type.sql` → `sprint5-job-moderation.sql` → `sprint5-cv-files.sql` → `sprint5-demo-jobs.sql`
- CSDL mới: `schema.sql` → `demo-data.sql` → `sprint4-job-work-time.sql` → `sprint5-employment-type.sql` → `sprint5-job-moderation.sql` → `sprint5-cv-files.sql` → `sprint5-demo-jobs.sql`

Cả bốn file chỉ thêm khi chưa có, không `DROP`, không `DELETE`; chạy lại nhiều lần không tạo trùng.

## Sprint 5 – CV dạng file PDF (`sprint5-cv-files.sql`)

Tạo bảng `cv_files` (cột `data` kiểu `MEDIUMBLOB`) để sinh viên **chọn file CV** thay vì dán liên kết.
File nằm trong MySQL nên không mất khi Railway triển khai lại. `cv_url` lưu dạng `/api/files/cv/{id}`.
File còn thêm CV PDF thật cho 2 sinh viên demo và thay liên kết giả `https://example.com/cv/...`.

## Sprint 5 – Thêm 30 tin demo (`sprint5-demo-jobs.sql`)

Chạy **sau cùng**. Thêm 2 nhà tuyển dụng demo (`gioimoi.demo@example.com` – Nhà sách Gió Mới,
`bienngoc.demo@example.com` – Khách sạn Biển Ngọc, mật khẩu `Demo@2026`) và 30 tin ở nhiều khung giờ:
sáng sớm từ 05:00, trưa, chiều, tối, khuya đến 23:00 và giờ linh hoạt; 26 bán thời gian, 4 toàn thời gian;
thù lao /giờ, /buổi, /tháng; nhiều tỉnh, thành. Sau khi chạy đủ các file Sprint 5, CSDL demo có **47 tin**.
