-- =====================================================================
-- Student Freelance Marketplace – Dữ liệu demo (Buổi 7)
-- Cơ sở dữ liệu: student_freelance_marketplace (chạy sau schema.sql)
--
-- Nội dung: 4 tài khoản demo (2 Sinh viên, 2 Nhà tuyển dụng), hồ sơ
-- đầy đủ và 6 tin tuyển dụng đang mở (OPEN) ở nhiều ngành nghề, khu vực
-- và mức thù lao khác nhau để demo tìm kiếm / lọc.
-- Không tạo sẵn đơn ứng tuyển: ứng tuyển, duyệt / từ chối và hoàn thành
-- công việc được thực hiện trực tiếp khi demo.
--
-- Mật khẩu chung của các tài khoản demo: Demo@2026 (mã hóa BCrypt)
--
-- An toàn khi chạy lại: chỉ dùng INSERT, mỗi dòng đều kiểm tra
-- NOT EXISTS nên không tạo trùng và không thay đổi dữ liệu đã có.
-- =====================================================================

USE `student_freelance_marketplace`;

SET @demo_password = '$2a$10$WBW4riT291DAs.xI0saIBeO81ARe9JM2YNKiXROpuMN5RAQaROulS';

-- ---------------------------------------------------------------------
-- 1. Tài khoản
-- ---------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Nguyễn Minh Anh', 'minhanh.demo@example.com', @demo_password, 'STUDENT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'minhanh.demo@example.com');

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Trần Quốc Huy', 'quochuy.demo@example.com', @demo_password, 'STUDENT'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'quochuy.demo@example.com');

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Phạm Thu Trang', 'songmay.demo@example.com', @demo_password, 'EMPLOYER'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'songmay.demo@example.com');

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Lê Hoàng Nam', 'anhduong.demo@example.com', @demo_password, 'EMPLOYER'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'anhduong.demo@example.com');

SET @sv_minhanh  = (SELECT id FROM users WHERE email = 'minhanh.demo@example.com');
SET @sv_quochuy  = (SELECT id FROM users WHERE email = 'quochuy.demo@example.com');
SET @ntd_songmay = (SELECT id FROM users WHERE email = 'songmay.demo@example.com');
SET @ntd_anhduong = (SELECT id FROM users WHERE email = 'anhduong.demo@example.com');

-- ---------------------------------------------------------------------
-- 2. Hồ sơ Sinh viên
-- ---------------------------------------------------------------------
INSERT INTO student_profiles (user_id, phone, school, major, cv_url, introduction)
SELECT @sv_minhanh, '0901 234 567', 'Trường Đại học Văn Lang', 'Công nghệ thông tin',
       'https://example.com/cv/nguyen-minh-anh.pdf',
       'Sinh viên năm 3, giao tiếp tốt, từng phục vụ quán cà phê 6 tháng. Có thể làm ca tối và cuối tuần.'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM student_profiles WHERE user_id = @sv_minhanh);

INSERT INTO student_profiles (user_id, phone, school, major, cv_url, introduction)
SELECT @sv_quochuy, '0912 345 678', 'Trường Đại học Văn Lang', 'Quản trị kinh doanh',
       'https://example.com/cv/tran-quoc-huy.pdf',
       'Sinh viên năm 2, thành thạo Excel, muốn tìm việc bán thời gian linh hoạt.'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM student_profiles WHERE user_id = @sv_quochuy);

-- ---------------------------------------------------------------------
-- 3. Hồ sơ Nhà tuyển dụng
-- ---------------------------------------------------------------------
INSERT INTO employer_profiles (user_id, organization_name, contact_phone, description)
SELECT @ntd_songmay, 'Cà phê Sông Mây', '028 3812 3456',
       'Chuỗi quán cà phê nhỏ tại TP. Hồ Chí Minh và Hà Nội, thường xuyên tuyển sinh viên làm ca.'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM employer_profiles WHERE user_id = @ntd_songmay);

INSERT INTO employer_profiles (user_id, organization_name, contact_phone, description)
SELECT @ntd_anhduong, 'Trung tâm Gia sư Ánh Dương', '024 3765 4321',
       'Trung tâm gia sư và trợ giảng cho học sinh tiểu học, THCS; hỗ trợ đào tạo cho sinh viên mới.'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM employer_profiles WHERE user_id = @ntd_anhduong);

-- ---------------------------------------------------------------------
-- 4. Tin tuyển dụng (OPEN)
--    Khu vực lọc = phần sau dấu phẩy cuối cùng của địa điểm.
--    Thù lao: theo giờ (ăn uống, bán lẻ, văn phòng) hoặc theo buổi (giáo dục).
-- ---------------------------------------------------------------------
INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule)
SELECT @ntd_songmay, 'Phục vụ quán cà phê ca tối',
       'Đón khách, ghi món và phục vụ đồ uống. Thù lao tính theo giờ, được đào tạo trong tuần đầu.',
       'Dịch vụ ăn uống', 'Quận Bình Thạnh, TP. Hồ Chí Minh', 25000, 30000, 'Ca tối 18:00–22:00, 4 buổi/tuần'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Phục vụ quán cà phê ca tối');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule)
SELECT @ntd_songmay, 'Pha chế part-time cuối tuần',
       'Pha chế cà phê, trà trái cây theo công thức của quán. Thù lao tính theo giờ, ưu tiên có kinh nghiệm.',
       'Dịch vụ ăn uống', 'Quận 1, TP. Hồ Chí Minh', 28000, 35000, 'Thứ Bảy, Chủ nhật 8:00–14:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Pha chế part-time cuối tuần');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule)
SELECT @ntd_songmay, 'Thu ngân ca sáng',
       'Tính tiền, quản lý hóa đơn và hỗ trợ sắp xếp hàng hóa tại quầy. Thù lao tính theo giờ.',
       'Bán lẻ', 'Quận Cầu Giấy, Hà Nội', 25000, 28000, 'Ca sáng 7:00–11:00, thứ Hai – thứ Sáu'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Thu ngân ca sáng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule)
SELECT @ntd_anhduong, 'Gia sư Toán lớp 9',
       'Kèm Toán cho học sinh lớp 9 ôn thi vào lớp 10 tại nhà học sinh. Thù lao tính theo buổi 2 giờ.',
       'Giáo dục', 'Quận 7, TP. Hồ Chí Minh', 150000, 200000, '3 buổi/tuần, 19:00–21:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Gia sư Toán lớp 9');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule)
SELECT @ntd_anhduong, 'Trợ giảng tiếng Anh thiếu nhi',
       'Hỗ trợ giáo viên chính trong lớp tiếng Anh 6–10 tuổi: điểm danh, tổ chức trò chơi. Thù lao tính theo buổi.',
       'Giáo dục', 'Quận Đống Đa, Hà Nội', 120000, 160000, 'Thứ Bảy, Chủ nhật 8:00–11:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Trợ giảng tiếng Anh thiếu nhi');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, work_schedule)
SELECT @ntd_anhduong, 'Cộng tác viên nhập liệu',
       'Nhập điểm và thông tin học viên vào hệ thống của trung tâm, làm việc từ xa. Thù lao tính theo giờ.',
       'Văn phòng', 'Làm việc từ xa, TP. Hồ Chí Minh', 20000, 25000, 'Linh hoạt, tối thiểu 15 giờ/tuần'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Cộng tác viên nhập liệu');

-- ---------------------------------------------------------------------
-- 5. Kiểm tra kết quả
-- ---------------------------------------------------------------------
SELECT u.id, u.full_name, u.email, u.role,
       COALESCE(sp.school, ep.organization_name) AS ho_so,
       (SELECT COUNT(*) FROM job_posts j WHERE j.employer_id = u.id) AS so_tin
FROM users u
LEFT JOIN student_profiles sp ON sp.user_id = u.id
LEFT JOIN employer_profiles ep ON ep.user_id = u.id
WHERE u.email LIKE '%.demo@example.com'
ORDER BY u.id;
