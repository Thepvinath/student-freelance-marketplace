-- =====================================================================
-- Student Freelance Marketplace – Database schema (MySQL 8.0)
-- Chuyên đề tốt nghiệp 2 – Van Lang University
--
-- Nguồn: xuất từ CSDL đang chạy (mysqldump --no-data, MySQL 8.0.43)
-- Chỉ chứa CẤU TRÚC, không chứa dữ liệu.
--
-- An toàn khi chạy lại: dùng IF NOT EXISTS, KHÔNG có DROP TABLE,
-- không xóa hay thay đổi dữ liệu đang có.
--
-- Lưu ý: reviewer_id <> reviewee_id được kiểm tra trong Spring Boot
-- (MySQL không cho CHECK trên cột FK có ON UPDATE CASCADE – Error 3823).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `student_freelance_marketplace`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `student_freelance_marketplace`;
SET NAMES utf8mb4;

-- 1. users: Tài khoản người dùng (STUDENT / EMPLOYER / ADMIN)
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('STUDENT','EMPLOYER','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. student_profiles: Hồ sơ sinh viên (1-1 với users) – FR-04
CREATE TABLE IF NOT EXISTS `student_profiles` (
  `user_id` bigint NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `major` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `introduction` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_student_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. employer_profiles: Hồ sơ nhà tuyển dụng (1-1 với users) – FR-04
CREATE TABLE IF NOT EXISTS `employer_profiles` (
  `user_id` bigint NOT NULL,
  `organization_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_employer_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. job_posts: Tin tuyển dụng – FR-05, FR-06, FR-09
CREATE TABLE IF NOT EXISTS `job_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employer_id` bigint NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `industry` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_min` decimal(12,2) NOT NULL,
  `salary_max` decimal(12,2) NOT NULL,
  `work_schedule` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_status` enum('OPEN','FILLED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_job_posts_employer` (`employer_id`),
  KEY `idx_job_posts_search` (`job_status`,`industry`,`location`),
  KEY `idx_job_posts_created_at` (`created_at`),
  CONSTRAINT `fk_job_posts_employer` FOREIGN KEY (`employer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_job_posts_salary` CHECK (((`salary_min` >= 0) and (`salary_max` >= `salary_min`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. applications: Đơn ứng tuyển, mỗi sinh viên ứng tuyển 1 tin 1 lần – FR-07, FR-08
CREATE TABLE IF NOT EXISTS `applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `job_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `introduction` text COLLATE utf8mb4_unicode_ci,
  `cv_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_applications_job_student` (`job_id`,`student_id`),
  KEY `idx_applications_student` (`student_id`),
  KEY `idx_applications_status` (`status`),
  CONSTRAINT `fk_applications_job` FOREIGN KEY (`job_id`) REFERENCES `job_posts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_applications_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. reviews: Đánh giá hai chiều sau khi hoàn thành công việc – FR-10
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `application_id` bigint NOT NULL,
  `reviewer_id` bigint NOT NULL,
  `reviewee_id` bigint NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reviews_application_reviewer` (`application_id`,`reviewer_id`),
  KEY `idx_reviews_reviewer` (`reviewer_id`),
  KEY `idx_reviews_reviewee` (`reviewee_id`),
  CONSTRAINT `fk_reviews_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_reviews_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. notifications: Thông báo khi trạng thái ứng tuyển thay đổi – FR-11
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  KEY `idx_notifications_application` (`application_id`),
  CONSTRAINT `fk_notifications_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kiểm tra: phải có đủ 7 bảng
SHOW TABLES;
