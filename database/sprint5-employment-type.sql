-- =====================================================================
-- Student Freelance Marketplace – Sprint 5: Loại hình công việc, đơn vị thù lao
-- Cơ sở dữ liệu: student_freelance_marketplace
--
-- Mục đích:
--   employment_type: Bán thời gian (PART_TIME) / Toàn thời gian (FULL_TIME).
--   salary_unit    : thù lao tính theo giờ (HOUR) / theo buổi (SHIFT) / theo tháng (MONTH),
--                    để thẻ việc ghi rõ "25.000 – 28.000 ₫/giờ".
--   Nhà tuyển dụng bắt buộc chọn cả hai khi đăng tin.
--
-- Thứ tự chạy:
--   CSDL đang có dữ liệu : sprint5-employment-type.sql → sprint5-job-moderation.sql
--   CSDL mới             : schema.sql → demo-data.sql → sprint4-job-work-time.sql
--                          → file này → sprint5-job-moderation.sql
--
-- An toàn khi chạy lại:
--   - Chỉ THÊM cột nếu chưa có (kiểm tra information_schema).
--   - Tin cũ nhận giá trị mặc định PART_TIME và HOUR; riêng các tin demo
--     trả theo buổi (gia sư, trợ giảng, chụp ảnh) được cập nhật thành SHIFT.
--   - Không DROP, không DELETE. Tài khoản / tin demo mới chỉ INSERT khi
--     chưa tồn tại (NOT EXISTS).
-- =====================================================================

USE `student_freelance_marketplace`;

-- ---------------------------------------------------------------------
-- 1. Thêm cột employment_type (mặc định PART_TIME cho các tin đã có)
-- ---------------------------------------------------------------------
SET @has_type = (SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'employment_type');
SET @sql = IF(@has_type = 0,
  'ALTER TABLE `job_posts` ADD COLUMN `employment_type` enum(''PART_TIME'',''FULL_TIME'') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''PART_TIME'' AFTER `end_time`',
  'SELECT ''employment_type đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1b. Thêm cột salary_unit (mặc định HOUR – thù lao theo giờ)
SET @has_unit = (SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'salary_unit');
SET @sql = IF(@has_unit = 0,
  'ALTER TABLE `job_posts` ADD COLUMN `salary_unit` enum(''HOUR'',''SHIFT'',''MONTH'') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''HOUR'' AFTER `salary_max`',
  'SELECT ''salary_unit đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1c. Tin demo trả theo buổi (mức 120.000 – 300.000 ₫ mỗi buổi dạy / buổi chụp)
SET @old_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
UPDATE job_posts j
JOIN users u ON u.id = j.employer_id
SET j.salary_unit = 'SHIFT'
WHERE u.email LIKE '%.demo@example.com'
  AND j.salary_unit = 'HOUR'
  AND j.title IN ('Gia sư Toán lớp 9', 'Trợ giảng tiếng Anh thiếu nhi', 'Gia sư Tiếng Anh lớp 5', 'Cộng tác viên chụp ảnh sự kiện');
SET SQL_SAFE_UPDATES = @old_safe_updates;

-- ---------------------------------------------------------------------
-- 2. Bổ sung 1 nhà tuyển dụng và 6 tin TOÀN THỜI GIAN để demo bộ lọc
--    Mật khẩu chung: Demo@2026 (BCrypt, giống demo-data.sql)
--    Thù lao của tin toàn thời gian tính theo tháng.
-- ---------------------------------------------------------------------
SET @demo_password = '$2a$10$WBW4riT291DAs.xI0saIBeO81ARe9JM2YNKiXROpuMN5RAQaROulS';

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Đặng Quốc Bảo', 'lamson.demo@example.com', @demo_password, 'EMPLOYER'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'lamson.demo@example.com');

SET @ntd_lamson   = (SELECT id FROM users WHERE email = 'lamson.demo@example.com');
SET @ntd_songmay  = (SELECT id FROM users WHERE email = 'songmay.demo@example.com');
SET @ntd_anhduong = (SELECT id FROM users WHERE email = 'anhduong.demo@example.com');
SET @ntd_saoviet  = (SELECT id FROM users WHERE email = 'saoviet.demo@example.com');

INSERT INTO employer_profiles (user_id, organization_name, contact_phone, description)
SELECT @ntd_lamson, 'Công ty TNHH Phần mềm Lam Sơn', '028 3930 5566',
       'Công ty phần mềm và dịch vụ khách hàng, có văn phòng tại TP. Hồ Chí Minh, Hà Nội và Đà Nẵng; nhận sinh viên năm cuối làm toàn thời gian.'
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employer_profiles WHERE user_id = @ntd_lamson);

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type)
SELECT @ntd_lamson, 'Nhân viên chăm sóc khách hàng',
       'Tiếp nhận cuộc gọi và email của khách hàng, ghi nhận yêu cầu vào hệ thống. Được đào tạo 2 tuần, có lương tháng 13.',
       'Văn phòng', 'Phường Sài Gòn, TP. Hồ Chí Minh', 8000000, 10000000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:00', '17:00', 'FULL_TIME'
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_lamson AND title = 'Nhân viên chăm sóc khách hàng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type)
SELECT @ntd_lamson, 'Thực tập sinh lập trình web',
       'Tham gia dự án React và Spring Boot cùng nhóm phát triển. Ưu tiên sinh viên năm cuối ngành Công nghệ thông tin.',
       'Văn phòng', 'Phường Hải Châu, Đà Nẵng', 5000000, 7000000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:00', '17:00', 'FULL_TIME'
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_lamson AND title = 'Thực tập sinh lập trình web');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type)
SELECT @ntd_lamson, 'Nhân viên nhập liệu toàn thời gian',
       'Nhập và đối chiếu dữ liệu đơn hàng trên Excel và phần mềm nội bộ. Yêu cầu cẩn thận, đánh máy nhanh.',
       'Văn phòng', 'Phường Cầu Giấy, Hà Nội', 7000000, 8500000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:00', '17:00', 'FULL_TIME'
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_lamson AND title = 'Nhân viên nhập liệu toàn thời gian');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type)
SELECT @ntd_songmay, 'Quản lý ca quán cà phê',
       'Điều phối nhân viên ca ngày, kiểm kho và chốt doanh thu. Phù hợp sinh viên đã tốt nghiệp hoặc năm cuối.',
       'Dịch vụ ăn uống', 'Phường Ninh Kiều, Cần Thơ', 7500000, 9000000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '07:30', '16:30', 'FULL_TIME'
FROM DUAL WHERE @ntd_songmay IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Quản lý ca quán cà phê');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type)
SELECT @ntd_anhduong, 'Trợ lý giáo vụ trung tâm',
       'Xếp lịch học, liên hệ phụ huynh và chuẩn bị tài liệu cho giáo viên. Có thể làm ngay sau khi tốt nghiệp.',
       'Giáo dục', 'Phường Đống Đa, Hà Nội', 7000000, 8000000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:00', '17:00', 'FULL_TIME'
FROM DUAL WHERE @ntd_anhduong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Trợ lý giáo vụ trung tâm');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type)
SELECT @ntd_saoviet, 'Nhân viên điều phối sự kiện',
       'Lên kế hoạch hậu cần, liên hệ nhà cung cấp và theo dõi tiến độ các sự kiện của khách hàng doanh nghiệp.',
       'Sự kiện', 'Phường Trấn Biên, Đồng Nai', 8500000, 11000000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:00', '17:00', 'FULL_TIME'
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Nhân viên điều phối sự kiện');

-- ---------------------------------------------------------------------
-- 3. Kiểm tra kết quả: số tin theo loại hình và đơn vị thù lao
-- ---------------------------------------------------------------------
SELECT employment_type AS loai_hinh, salary_unit AS don_vi_thu_lao, COUNT(*) AS so_tin
FROM job_posts
GROUP BY employment_type, salary_unit;
