-- =====================================================================
-- Student Freelance Marketplace – Sprint 4: Khung giờ làm việc
-- Cơ sở dữ liệu: student_freelance_marketplace
--
-- Mục đích: sinh viên chọn khung giờ rảnh (ví dụ 17:00 – 19:00) và chỉ xem
-- các công việc nằm trong khung giờ đó. Cần lưu giờ bắt đầu / kết thúc
-- dạng TIME thay vì chỉ có chuỗi work_schedule.
--
-- Thứ tự chạy:
--   CSDL đang có dữ liệu : chạy file này (không cần chạy lại schema.sql)
--   CSDL mới             : schema.sql → demo-data.sql → file này
--
-- An toàn khi chạy lại:
--   - Chỉ THÊM cột và ràng buộc nếu chưa có (kiểm tra information_schema).
--   - Không DROP, không DELETE, không đổi dữ liệu đã có ngoài việc điền giờ
--     cho các tin demo đang để trống giờ (start_time IS NULL).
--   - Tin demo mới chỉ INSERT khi chưa tồn tại (NOT EXISTS).
-- =====================================================================

USE `student_freelance_marketplace`;

-- ---------------------------------------------------------------------
-- 1. Thêm cột start_time, end_time (NULL = giờ linh hoạt)
-- ---------------------------------------------------------------------
SET @has_start = (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'start_time');
SET @sql = IF(@has_start = 0,
  'ALTER TABLE `job_posts` ADD COLUMN `start_time` time DEFAULT NULL AFTER `work_schedule`, ADD COLUMN `end_time` time DEFAULT NULL AFTER `start_time`',
  'SELECT ''start_time / end_time đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ràng buộc: hoặc cả hai trống, hoặc cả hai có giá trị và giờ kết thúc sau giờ bắt đầu.
-- (Không hỗ trợ ca qua nửa đêm, ví dụ 22:00 – 02:00.)
SET @has_check = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND CONSTRAINT_NAME = 'chk_job_posts_work_time');
SET @sql = IF(@has_check = 0,
  'ALTER TABLE `job_posts` ADD CONSTRAINT `chk_job_posts_work_time` CHECK (((`start_time` is null) and (`end_time` is null)) or ((`start_time` is not null) and (`end_time` is not null) and (`end_time` > `start_time`)))',
  'SELECT ''chk_job_posts_work_time đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 2. Điền giờ cho 6 tin demo của Buổi 7 (chỉ khi còn trống)
--    "Cộng tác viên nhập liệu" giữ NULL vì lịch làm việc linh hoạt.
-- ---------------------------------------------------------------------
SET @ntd_songmay  = (SELECT id FROM users WHERE email = 'songmay.demo@example.com');
SET @ntd_anhduong = (SELECT id FROM users WHERE email = 'anhduong.demo@example.com');

UPDATE job_posts SET start_time = '18:00', end_time = '22:00'
WHERE employer_id = @ntd_songmay AND title = 'Phục vụ quán cà phê ca tối' AND start_time IS NULL;
UPDATE job_posts SET start_time = '08:00', end_time = '14:00'
WHERE employer_id = @ntd_songmay AND title = 'Pha chế part-time cuối tuần' AND start_time IS NULL;
UPDATE job_posts SET start_time = '07:00', end_time = '11:00'
WHERE employer_id = @ntd_songmay AND title = 'Thu ngân ca sáng' AND start_time IS NULL;
UPDATE job_posts SET start_time = '19:00', end_time = '21:00'
WHERE employer_id = @ntd_anhduong AND title = 'Gia sư Toán lớp 9' AND start_time IS NULL;
UPDATE job_posts SET start_time = '08:00', end_time = '11:00'
WHERE employer_id = @ntd_anhduong AND title = 'Trợ giảng tiếng Anh thiếu nhi' AND start_time IS NULL;

-- ---------------------------------------------------------------------
-- 3. Bổ sung 1 nhà tuyển dụng và 5 tin demo để demo lọc theo khung giờ
--    Mật khẩu chung: Demo@2026 (BCrypt, giống demo-data.sql)
-- ---------------------------------------------------------------------
SET @demo_password = '$2a$10$WBW4riT291DAs.xI0saIBeO81ARe9JM2YNKiXROpuMN5RAQaROulS';

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Võ Thanh Tâm', 'saoviet.demo@example.com', @demo_password, 'EMPLOYER'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'saoviet.demo@example.com');
SET @ntd_saoviet = (SELECT id FROM users WHERE email = 'saoviet.demo@example.com');

INSERT INTO employer_profiles (user_id, organization_name, contact_phone, description)
SELECT @ntd_saoviet, 'Công ty Sự kiện Sao Việt', '028 3920 1122',
       'Tổ chức sự kiện, hội chợ và hoạt động quảng bá thương hiệu; thường tuyển sinh viên theo ca.'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM employer_profiles WHERE user_id = @ntd_saoviet);

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule, start_time, end_time)
SELECT @ntd_songmay, 'Phục vụ quán cà phê ca chiều',
       'Phục vụ đồ uống và dọn bàn giờ tan tầm. Phù hợp sinh viên học buổi sáng. Thù lao tính theo giờ.',
       'Dịch vụ ăn uống', 'Quận 3, TP. Hồ Chí Minh', 25000, 28000, 'Thứ Hai – thứ Sáu', '17:00', '19:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Phục vụ quán cà phê ca chiều');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule, start_time, end_time)
SELECT @ntd_anhduong, 'Gia sư Tiếng Anh lớp 5',
       'Kèm Tiếng Anh cho học sinh lớp 5 tại nhà, có giáo trình của trung tâm. Thù lao tính theo buổi.',
       'Giáo dục', 'Quận Gò Vấp, TP. Hồ Chí Minh', 120000, 150000, 'Thứ Ba, Thứ Năm', '17:30', '19:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Gia sư Tiếng Anh lớp 5');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule, start_time, end_time)
SELECT @ntd_saoviet, 'Hỗ trợ sự kiện cuối tuần',
       'Đón khách, hướng dẫn khu vực và hỗ trợ hậu cần tại sự kiện. Có đồng phục và suất ăn.',
       'Sự kiện', 'Quận 1, TP. Hồ Chí Minh', 30000, 40000, 'Thứ Bảy, Chủ nhật', '13:00', '21:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Hỗ trợ sự kiện cuối tuần');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule, start_time, end_time)
SELECT @ntd_saoviet, 'Phát tờ rơi khai trương cửa hàng',
       'Phát tờ rơi và giới thiệu chương trình khuyến mãi tại khu vực trung tâm thương mại.',
       'Marketing', 'Quận Hai Bà Trưng, Hà Nội', 22000, 25000, 'Thứ Hai – thứ Bảy', '15:00', '18:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Phát tờ rơi khai trương cửa hàng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule, start_time, end_time)
SELECT @ntd_saoviet, 'Cộng tác viên chụp ảnh sự kiện',
       'Chụp ảnh hoạt động tại sự kiện buổi tối, tự chuẩn bị máy ảnh. Thù lao tính theo buổi.',
       'Truyền thông', 'Quận 7, TP. Hồ Chí Minh', 200000, 300000, 'Theo lịch sự kiện, 2–3 buổi/tuần', '18:00', '22:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Cộng tác viên chụp ảnh sự kiện');

-- ---------------------------------------------------------------------
-- 4. Kiểm tra kết quả: tin đang mở và khung giờ
-- ---------------------------------------------------------------------
SELECT j.id, j.title, j.work_schedule,
       TIME_FORMAT(j.start_time, '%H:%i') AS bat_dau,
       TIME_FORMAT(j.end_time, '%H:%i')   AS ket_thuc,
       j.job_status
FROM job_posts j
ORDER BY j.start_time IS NULL, j.start_time, j.id;
