-- =====================================================================
-- Student Freelance Marketplace – Sprint 5: Kiểm duyệt tin tuyển dụng
-- Cơ sở dữ liệu: student_freelance_marketplace
--
-- Mục đích: tin mới (hoặc tin vừa chỉnh sửa) phải được Quản trị viên
-- (ADMIN) duyệt trước khi hiện cho sinh viên.
--   moderation_status : PENDING (chờ duyệt) / APPROVED (đã duyệt) / REJECTED (từ chối)
--   moderation_note   : lý do từ chối (bắt buộc khi REJECTED)
--   reviewed_by       : ADMIN đã duyệt / từ chối
--   reviewed_at       : thời điểm duyệt / từ chối
--
-- Thứ tự chạy:
--   CSDL đang có dữ liệu : sprint5-employment-type.sql → file này
--   CSDL mới             : schema.sql → demo-data.sql → sprint4-job-work-time.sql
--                          → sprint5-employment-type.sql → file này
--
-- An toàn khi chạy lại:
--   - Chỉ THÊM cột / khóa ngoại / chỉ mục nếu chưa có.
--   - Tin ĐÃ CÓ trước khi chạy file này được giữ nguyên là đang hiển thị
--     (APPROVED); chỉ tin đăng SAU đó mới phải chờ duyệt.
--   - Không DROP, không DELETE. Tài khoản ADMIN demo chỉ INSERT khi chưa có.
-- =====================================================================

USE `student_freelance_marketplace`;

-- Workbench bật "Safe Updates" mặc định; tạm tắt cho bước 5, cuối file bật lại.
SET @old_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- ---------------------------------------------------------------------
-- 1. Thêm 4 cột kiểm duyệt.
--    Khi thêm cột, mặc định tạm là APPROVED để mọi tin đang có vẫn hiển thị.
-- ---------------------------------------------------------------------
SET @has_mod = (SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND COLUMN_NAME = 'moderation_status');
SET @sql = IF(@has_mod = 0,
  'ALTER TABLE `job_posts`
     ADD COLUMN `moderation_status` enum(''PENDING'',''APPROVED'',''REJECTED'') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''APPROVED'' AFTER `job_status`,
     ADD COLUMN `moderation_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `moderation_status`,
     ADD COLUMN `reviewed_by` bigint DEFAULT NULL AFTER `moderation_note`,
     ADD COLUMN `reviewed_at` datetime DEFAULT NULL AFTER `reviewed_by`',
  'SELECT ''Các cột kiểm duyệt đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Từ nay tin mới mặc định là PENDING (chờ duyệt). Chạy lại nhiều lần vẫn an toàn.
ALTER TABLE `job_posts` ALTER COLUMN `moderation_status` SET DEFAULT 'PENDING';

-- ---------------------------------------------------------------------
-- 3. Khóa ngoại reviewed_by → users(id) và chỉ mục để lọc tin theo trạng thái duyệt
-- ---------------------------------------------------------------------
SET @has_fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
               WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND CONSTRAINT_NAME = 'fk_job_posts_reviewer');
SET @sql = IF(@has_fk = 0,
  'ALTER TABLE `job_posts` ADD CONSTRAINT `fk_job_posts_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT ''fk_job_posts_reviewer đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_posts' AND INDEX_NAME = 'idx_job_posts_moderation');
SET @sql = IF(@has_idx = 0,
  'ALTER TABLE `job_posts` ADD KEY `idx_job_posts_moderation` (`moderation_status`, `job_status`)',
  'SELECT ''idx_job_posts_moderation đã có, bỏ qua'' AS ghi_chu');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 4. Tài khoản Quản trị viên demo
--    Trang web không cho đăng ký ADMIN, nên tạo bằng SQL.
--    Email: admin.demo@example.com – Mật khẩu: Demo@2026 (giống tài khoản demo khác)
-- ---------------------------------------------------------------------
SET @demo_password = '$2a$10$WBW4riT291DAs.xI0saIBeO81ARe9JM2YNKiXROpuMN5RAQaROulS';

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Quản trị viên', 'admin.demo@example.com', @demo_password, 'ADMIN'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin.demo@example.com');

-- ---------------------------------------------------------------------
-- 5. Tin của các tài khoản demo (*.demo@example.com) chưa từng được xét
--    → coi như đã duyệt, để dữ liệu demo hiển thị ngay.
--    (Cần cho CSDL mới, vì schema.sql mới đặt mặc định là PENDING.)
--    Tin do người dùng thật đăng KHÔNG bị đụng tới.
-- ---------------------------------------------------------------------
UPDATE job_posts j
JOIN users u ON u.id = j.employer_id
SET j.moderation_status = 'APPROVED'
WHERE u.email LIKE '%.demo@example.com'
  AND j.moderation_status = 'PENDING'
  AND j.reviewed_at IS NULL;

SET SQL_SAFE_UPDATES = @old_safe_updates;

-- ---------------------------------------------------------------------
-- 6. Kiểm tra kết quả
-- ---------------------------------------------------------------------
SELECT moderation_status AS trang_thai_duyet, COUNT(*) AS so_tin
FROM job_posts
GROUP BY moderation_status;

SELECT id, full_name, email, role FROM users WHERE role = 'ADMIN';
