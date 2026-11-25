-- =====================================================================
-- Student Freelance Marketplace – Sprint 5: Thêm 30 tin tuyển dụng demo
-- Cơ sở dữ liệu: student_freelance_marketplace
--
-- Mục đích: có đủ việc ở nhiều khung giờ để demo bộ lọc:
--   sáng sớm (05:00–09:30), sáng, trưa, chiều, tối, khuya (đến 23:00) và giờ linh hoạt;
--   26 việc bán thời gian + 4 việc toàn thời gian; thù lao /giờ, /buổi, /tháng;
--   trải đều nhiều tỉnh, thành (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Hải Phòng, Cần Thơ,
--   Huế, Khánh Hòa, Nghệ An, Đồng Nai, An Giang).
--   Thêm 2 nhà tuyển dụng demo (mật khẩu Demo@2026):
--     gioimoi.demo@example.com  – Nhà sách Gió Mới
--     bienngoc.demo@example.com – Khách sạn Biển Ngọc
--   Các tin được đặt sẵn APPROVED (dữ liệu demo) và ngày đăng lùi 1–13 ngày.
--
-- Thứ tự chạy (chạy SAU cùng):
--   CSDL đang có dữ liệu : sprint5-employment-type.sql → sprint5-job-moderation.sql
--                          → sprint5-cv-files.sql → file này
--   CSDL mới             : schema.sql → demo-data.sql → sprint4-job-work-time.sql
--                          → sprint5-employment-type.sql → sprint5-job-moderation.sql
--                          → sprint5-cv-files.sql → file này
--
-- An toàn khi chạy lại: chỉ INSERT khi chưa có (NOT EXISTS), không DROP, không DELETE.
-- =====================================================================

USE `student_freelance_marketplace`;

SET @demo_password = '$2a$10$WBW4riT291DAs.xI0saIBeO81ARe9JM2YNKiXROpuMN5RAQaROulS';

-- ---------------------------------------------------------------------
-- 1. Hai nhà tuyển dụng demo mới
-- ---------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Hoàng Thị Mai', 'gioimoi.demo@example.com', @demo_password, 'EMPLOYER'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'gioimoi.demo@example.com');

INSERT INTO users (full_name, email, password_hash, role)
SELECT 'Võ Thanh Tùng', 'bienngoc.demo@example.com', @demo_password, 'EMPLOYER'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'bienngoc.demo@example.com');

SET @ntd_gioimoi  = (SELECT id FROM users WHERE email = 'gioimoi.demo@example.com');
SET @ntd_bienngoc = (SELECT id FROM users WHERE email = 'bienngoc.demo@example.com');
SET @ntd_songmay  = (SELECT id FROM users WHERE email = 'songmay.demo@example.com');
SET @ntd_anhduong = (SELECT id FROM users WHERE email = 'anhduong.demo@example.com');
SET @ntd_saoviet  = (SELECT id FROM users WHERE email = 'saoviet.demo@example.com');
SET @ntd_lamson   = (SELECT id FROM users WHERE email = 'lamson.demo@example.com');

INSERT INTO employer_profiles (user_id, organization_name, contact_phone, description)
SELECT @ntd_gioimoi, 'Nhà sách Gió Mới', '024 3825 7788',
       'Chuỗi nhà sách tại Hà Nội, Huế và Nghệ An; thường tuyển sinh viên bán hàng, kho và nội dung.'
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employer_profiles WHERE user_id = @ntd_gioimoi);

INSERT INTO employer_profiles (user_id, organization_name, contact_phone, description)
SELECT @ntd_bienngoc, 'Khách sạn Biển Ngọc', '0258 352 6699',
       'Khách sạn 4 sao tại Nha Trang và Đà Nẵng, tuyển sinh viên ngành du lịch, nhà hàng theo ca.'
FROM DUAL WHERE @ntd_bienngoc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employer_profiles WHERE user_id = @ntd_bienngoc);

-- ---------------------------------------------------------------------
-- 2. 30 tin tuyển dụng (sắp theo giờ bắt đầu, tin giờ linh hoạt và toàn thời gian ở cuối)
-- ---------------------------------------------------------------------
INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_bienngoc, 'Phụ bếp ca sáng sớm',
       'Sơ chế rau củ, chuẩn bị buffet sáng cho khách lưu trú. Được ăn sáng tại khách sạn.',
       'Dịch vụ ăn uống', 'Phường Nha Trang, Khánh Hòa', 25000, 30000, 'HOUR', 'Thứ Hai – Chủ nhật, xoay ca', '05:30', '09:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 1 DAY
FROM DUAL WHERE @ntd_bienngoc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_bienngoc AND title = 'Phụ bếp ca sáng sớm');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Giao báo và tạp chí buổi sáng',
       'Nhận báo tại nhà sách và giao cho khách đặt dài hạn trong khu vực. Cần có xe máy.',
       'Bán lẻ', 'Phường Hoàn Kiếm, Hà Nội', 22000, 26000, 'HOUR', 'Thứ Hai – thứ Sáu', '05:00', '07:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 6 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Giao báo và tạp chí buổi sáng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_songmay, 'Nhân viên bán bánh mì buổi sáng',
       'Bán bánh mì và cà phê mang đi tại quầy, thu tiền và dọn quầy sau ca.',
       'Dịch vụ ăn uống', 'Phường Bến Thành, TP. Hồ Chí Minh', 23000, 27000, 'HOUR', 'Thứ Hai – thứ Bảy', '06:00', '09:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 2 DAY
FROM DUAL WHERE @ntd_songmay IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Nhân viên bán bánh mì buổi sáng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_anhduong, 'Trợ giảng lớp Tin học cơ bản',
       'Hỗ trợ giáo viên hướng dẫn học viên thực hành Word, Excel. Thù lao tính theo buổi.',
       'Giáo dục', 'Phường Thủ Đức, TP. Hồ Chí Minh', 120000, 150000, 'SHIFT', 'Thứ Bảy, Chủ nhật', '08:00', '11:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 4 DAY
FROM DUAL WHERE @ntd_anhduong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Trợ giảng lớp Tin học cơ bản');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Nhân viên kho sách ca sáng',
       'Nhập sách mới, dán tem giá và sắp xếp kệ theo danh mục.',
       'Bán lẻ', 'Phường Thuận Hóa, Huế', 22000, 25000, 'HOUR', 'Thứ Hai – thứ Sáu', '07:30', '11:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 9 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Nhân viên kho sách ca sáng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Thu ngân nhà sách ca sáng',
       'Tính tiền, đóng gói và tư vấn chương trình khuyến mãi cho khách.',
       'Bán lẻ', 'Phường Cầu Giấy, Hà Nội', 24000, 27000, 'HOUR', 'Thứ Hai – Chủ nhật, xoay ca', '08:00', '12:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 3 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Thu ngân nhà sách ca sáng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_bienngoc, 'Lễ tân khách sạn ca sáng',
       'Đón khách, làm thủ tục nhận và trả phòng, trả lời điện thoại. Ưu tiên biết tiếng Anh.',
       'Khách sạn', 'Phường Hải Châu, Đà Nẵng', 27000, 32000, 'HOUR', 'Thứ Hai – Chủ nhật, xoay ca', '06:00', '12:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 5 DAY
FROM DUAL WHERE @ntd_bienngoc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_bienngoc AND title = 'Lễ tân khách sạn ca sáng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_songmay, 'Phục vụ cơm trưa văn phòng',
       'Phục vụ và dọn bàn giờ cao điểm buổi trưa. Được ăn trưa miễn phí.',
       'Dịch vụ ăn uống', 'Phường Sài Gòn, TP. Hồ Chí Minh', 25000, 28000, 'HOUR', 'Thứ Hai – thứ Sáu', '10:30', '13:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 1 DAY
FROM DUAL WHERE @ntd_songmay IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Phục vụ cơm trưa văn phòng');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_songmay, 'Giao cơm trưa bằng xe máy',
       'Giao suất cơm trưa cho văn phòng trong bán kính 3 km. Hỗ trợ tiền xăng.',
       'Dịch vụ ăn uống', 'Phường Ninh Kiều, Cần Thơ', 25000, 35000, 'HOUR', 'Thứ Hai – thứ Sáu', '10:30', '13:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 7 DAY
FROM DUAL WHERE @ntd_songmay IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Giao cơm trưa bằng xe máy');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_saoviet, 'Trực quầy thông tin trung tâm thương mại',
       'Hướng dẫn khách tham quan, phát phiếu khảo sát và quà tặng tại quầy.',
       'Sự kiện', 'Phường Ngô Quyền, Hải Phòng', 25000, 28000, 'HOUR', 'Thứ Bảy, Chủ nhật', '09:00', '15:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 12 DAY
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Trực quầy thông tin trung tâm thương mại');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_anhduong, 'Gia sư Toán lớp 6 buổi chiều',
       'Kèm Toán tại nhà học sinh, mỗi buổi 2 giờ. Thù lao tính theo buổi.',
       'Giáo dục', 'Phường Cầu Giấy, Hà Nội', 150000, 180000, 'SHIFT', 'Thứ Hai, Thứ Tư, Thứ Sáu', '14:00', '16:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 2 DAY
FROM DUAL WHERE @ntd_anhduong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Gia sư Toán lớp 6 buổi chiều');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_lamson, 'Trợ lý chăm sóc fanpage',
       'Trả lời tin nhắn, đăng bài theo lịch và tổng hợp phản hồi khách hàng.',
       'Marketing', 'Làm việc từ xa, TP. Hồ Chí Minh', 30000, 40000, 'HOUR', 'Thứ Hai – thứ Sáu', '13:00', '17:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 4 DAY
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_lamson AND title = 'Trợ lý chăm sóc fanpage');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Tư vấn bán sách thiếu nhi',
       'Giới thiệu sách theo độ tuổi, hướng dẫn phụ huynh chọn sách và sắp xếp góc thiếu nhi.',
       'Bán lẻ', 'Phường Thành Vinh, Nghệ An', 22000, 25000, 'HOUR', 'Thứ Hai – thứ Sáu', '13:30', '17:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 8 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Tư vấn bán sách thiếu nhi');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_lamson, 'Kiểm thử phần mềm bán thời gian',
       'Chạy kịch bản kiểm thử thủ công trên web và điện thoại, ghi lỗi vào hệ thống.',
       'Văn phòng', 'Phường Hải Châu, Đà Nẵng', 35000, 45000, 'HOUR', 'Thứ Hai – thứ Sáu', '13:30', '17:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 3 DAY
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_lamson AND title = 'Kiểm thử phần mềm bán thời gian');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_saoviet, 'Hướng dẫn viên tham quan cuối tuần',
       'Dẫn đoàn khách tham quan phố cổ, giới thiệu lịch sử. Thù lao tính theo buổi.',
       'Sự kiện', 'Phường Hội An, Đà Nẵng', 250000, 300000, 'SHIFT', 'Thứ Bảy, Chủ nhật', '13:00', '17:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 10 DAY
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Hướng dẫn viên tham quan cuối tuần');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_anhduong, 'Trợ giảng IELTS buổi tối',
       'Chấm bài viết, luyện nói cùng học viên nhóm nhỏ. Yêu cầu IELTS 6.5 trở lên.',
       'Giáo dục', 'Phường Bình Thạnh, TP. Hồ Chí Minh', 150000, 200000, 'SHIFT', 'Thứ Ba, Thứ Năm', '18:30', '20:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 1 DAY
FROM DUAL WHERE @ntd_anhduong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Trợ giảng IELTS buổi tối');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_bienngoc, 'Phục vụ nhà hàng hải sản ca tối',
       'Đón khách, ghi món, phục vụ bàn. Có tiền tip chia đều cuối tuần.',
       'Dịch vụ ăn uống', 'Phường Nha Trang, Khánh Hòa', 25000, 30000, 'HOUR', 'Thứ Hai – Chủ nhật, xoay ca', '17:00', '22:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 2 DAY
FROM DUAL WHERE @ntd_bienngoc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_bienngoc AND title = 'Phục vụ nhà hàng hải sản ca tối');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Nhân viên bán hàng nhà sách ca tối',
       'Tư vấn sách, văn phòng phẩm và thu ngân khi đông khách.',
       'Bán lẻ', 'Phường Đống Đa, Hà Nội', 23000, 26000, 'HOUR', 'Thứ Hai – Chủ nhật, xoay ca', '17:30', '21:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 5 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Nhân viên bán hàng nhà sách ca tối');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_songmay, 'Pha chế trà sữa ca tối',
       'Pha chế theo công thức có sẵn, được đào tạo 3 ngày đầu.',
       'Dịch vụ ăn uống', 'Phường Trấn Biên, Đồng Nai', 23000, 27000, 'HOUR', 'Thứ Hai – Chủ nhật, xoay ca', '18:00', '22:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 3 DAY
FROM DUAL WHERE @ntd_songmay IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_songmay AND title = 'Pha chế trà sữa ca tối');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_saoviet, 'Livestream bán hàng buổi tối',
       'Giới thiệu sản phẩm trong phiên livestream 3 giờ, có kịch bản sẵn. Thù lao tính theo buổi.',
       'Marketing', 'Phường Gò Vấp, TP. Hồ Chí Minh', 200000, 300000, 'SHIFT', 'Thứ Hai, Thứ Tư, Thứ Sáu', '19:00', '22:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 6 DAY
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Livestream bán hàng buổi tối');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_anhduong, 'Gia sư Tiếng Anh giao tiếp online',
       'Dạy 1 kèm 1 qua Google Meet, giáo trình do trung tâm cung cấp.',
       'Giáo dục', 'Làm việc từ xa, Hà Nội', 120000, 150000, 'SHIFT', 'Linh hoạt theo lịch học viên, 3 buổi/tuần', '20:00', '21:30', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 4 DAY
FROM DUAL WHERE @ntd_anhduong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Gia sư Tiếng Anh giao tiếp online');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_saoviet, 'Chụp ảnh tiệc cưới cuối tuần',
       'Chụp ảnh phóng sự tiệc cưới, giao ảnh đã chọn lọc trong 3 ngày. Cần có máy ảnh riêng.',
       'Truyền thông', 'Phường Thủ Dầu Một, TP. Hồ Chí Minh', 400000, 600000, 'SHIFT', 'Thứ Bảy, Chủ nhật', '16:00', '22:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 11 DAY
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Chụp ảnh tiệc cưới cuối tuần');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_bienngoc, 'Phục vụ quầy bar ca khuya',
       'Pha chế đồ uống không cồn và phục vụ khách tại quầy bar tầng thượng.',
       'Dịch vụ ăn uống', 'Phường Sơn Trà, Đà Nẵng', 30000, 35000, 'HOUR', 'Thứ Sáu – Chủ nhật', '19:00', '23:00', 'PART_TIME', 'APPROVED', NOW() - INTERVAL 2 DAY
FROM DUAL WHERE @ntd_bienngoc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_bienngoc AND title = 'Phục vụ quầy bar ca khuya');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Viết bài giới thiệu sách',
       'Viết bài review sách mới cho website và fanpage, khoảng 3 bài mỗi tuần.',
       'Truyền thông', 'Làm việc từ xa, Huế', 35000, 45000, 'HOUR', 'Linh hoạt, khoảng 6 giờ/tuần', NULL, NULL, 'PART_TIME', 'APPROVED', NOW() - INTERVAL 7 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Viết bài giới thiệu sách');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_lamson, 'Cộng tác viên dịch tài liệu tiếng Anh',
       'Dịch hướng dẫn sử dụng phần mềm từ tiếng Anh sang tiếng Việt.',
       'Văn phòng', 'Làm việc từ xa, Đà Nẵng', 40000, 60000, 'HOUR', 'Linh hoạt, tối thiểu 10 giờ/tuần', NULL, NULL, 'PART_TIME', 'APPROVED', NOW() - INTERVAL 9 DAY
FROM DUAL WHERE @ntd_lamson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_lamson AND title = 'Cộng tác viên dịch tài liệu tiếng Anh');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_saoviet, 'Khảo sát khách hàng tại điểm bán',
       'Phỏng vấn nhanh khách mua hàng theo bảng hỏi có sẵn. Thù lao tính theo buổi.',
       'Marketing', 'Phường Long Xuyên, An Giang', 180000, 220000, 'SHIFT', 'Linh hoạt theo lịch khảo sát, 2–3 buổi/tuần', NULL, NULL, 'PART_TIME', 'APPROVED', NOW() - INTERVAL 13 DAY
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Khảo sát khách hàng tại điểm bán');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_bienngoc, 'Nhân viên lễ tân khách sạn',
       'Làm việc theo ca 8 tiếng, xoay ca sáng và chiều. Có bảo hiểm và phụ cấp ăn ca.',
       'Khách sạn', 'Phường Nha Trang, Khánh Hòa', 7500000, 9000000, 'MONTH', 'Thứ Hai – thứ Bảy, xoay ca, lương theo tháng', '07:00', '15:00', 'FULL_TIME', 'APPROVED', NOW() - INTERVAL 3 DAY
FROM DUAL WHERE @ntd_bienngoc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_bienngoc AND title = 'Nhân viên lễ tân khách sạn');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_gioimoi, 'Nhân viên kinh doanh nhà sách',
       'Tìm khách hàng trường học, doanh nghiệp đặt sách số lượng lớn. Có thưởng doanh số.',
       'Bán lẻ', 'Phường Thuận Hóa, Huế', 7000000, 8500000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:00', '17:00', 'FULL_TIME', 'APPROVED', NOW() - INTERVAL 6 DAY
FROM DUAL WHERE @ntd_gioimoi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_gioimoi AND title = 'Nhân viên kinh doanh nhà sách');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_saoviet, 'Chuyên viên tổ chức sự kiện',
       'Lên kế hoạch, làm việc với nhà cung cấp và điều phối sự kiện cho khách hàng doanh nghiệp.',
       'Sự kiện', 'Phường Ngô Quyền, Hải Phòng', 9000000, 12000000, 'MONTH', 'Thứ Hai – thứ Sáu, lương theo tháng', '08:30', '17:30', 'FULL_TIME', 'APPROVED', NOW() - INTERVAL 8 DAY
FROM DUAL WHERE @ntd_saoviet IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_saoviet AND title = 'Chuyên viên tổ chức sự kiện');

INSERT INTO job_posts (employer_id, title, description, industry, location, salary_min, salary_max, salary_unit, work_schedule, start_time, end_time, employment_type, moderation_status, created_at)
SELECT @ntd_anhduong, 'Giáo viên tiếng Anh thiếu nhi',
       'Dạy các lớp tiếng Anh thiếu nhi buổi chiều và tối. Có lộ trình đào tạo giáo viên.',
       'Giáo dục', 'Phường Thành Vinh, Nghệ An', 8000000, 10000000, 'MONTH', 'Thứ Ba – thứ Bảy, lương theo tháng', '13:00', '21:00', 'FULL_TIME', 'APPROVED', NOW() - INTERVAL 4 DAY
FROM DUAL WHERE @ntd_anhduong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM job_posts WHERE employer_id = @ntd_anhduong AND title = 'Giáo viên tiếng Anh thiếu nhi');

-- ---------------------------------------------------------------------
-- 3. Kiểm tra kết quả: số việc đang hiển thị theo ca
-- ---------------------------------------------------------------------
SELECT
  SUM(start_time IS NOT NULL AND start_time <  '12:00')                       AS ca_sang,
  SUM(start_time >= '12:00' AND start_time < '17:00')                         AS ca_chieu,
  SUM(start_time >= '17:00')                                                  AS ca_toi,
  SUM(start_time IS NULL)                                                     AS gio_linh_hoat,
  SUM(employment_type = 'FULL_TIME')                                          AS toan_thoi_gian,
  COUNT(*)                                                                    AS tong_so_tin
FROM job_posts
WHERE job_status = 'OPEN' AND moderation_status = 'APPROVED';
