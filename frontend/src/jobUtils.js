// Tiện ích dùng chung cho trang việc làm (định dạng tiền, khu vực, khung giờ).

const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

export function money(value) {
  return `${currency.format(Number(value))} ₫`
}

// Sprint 5: đơn vị thù lao – thẻ việc ghi rõ "25.000 – 28.000 ₫/giờ"
export const SALARY_UNITS = {
  HOUR: { label: 'Theo giờ', suffix: '/giờ', example: ['25000', '30000'] },
  SHIFT: { label: 'Theo buổi', suffix: '/buổi', example: ['150000', '200000'] },
  MONTH: { label: 'Theo tháng', suffix: '/tháng', example: ['7000000', '9000000'] },
}

export function salaryLabel(job) {
  const suffix = SALARY_UNITS[job.salaryUnit]?.suffix || ''
  return `${currency.format(Number(job.salaryMin))} – ${currency.format(Number(job.salaryMax))} ₫${suffix}`
}

// ---------- Khu vực: 34 tỉnh, thành phố (sau sắp xếp đơn vị hành chính 2025) ----------
export const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế']
export const PROVINCES = [
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai',
  'Đồng Tháp', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lâm Đồng',
  'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long',
]
export const ALL_AREAS = [...CITIES, ...PROVINCES]

// Tên tỉnh cũ (trước 2025) → tỉnh, thành phố mới, để tin cũ ghi "Bình Dương" vẫn lọc đúng.
const OLD_AREAS = {
  'hà giang': 'Tuyên Quang', 'yên bái': 'Lào Cai', 'bắc kạn': 'Thái Nguyên',
  'vĩnh phúc': 'Phú Thọ', 'hòa bình': 'Phú Thọ', 'bắc giang': 'Bắc Ninh', 'thái bình': 'Hưng Yên',
  'hải dương': 'Hải Phòng', 'hà nam': 'Ninh Bình', 'nam định': 'Ninh Bình', 'quảng bình': 'Quảng Trị',
  'thừa thiên huế': 'Huế', 'quảng nam': 'Đà Nẵng', 'kon tum': 'Quảng Ngãi', 'bình định': 'Gia Lai',
  'ninh thuận': 'Khánh Hòa', 'đắk nông': 'Lâm Đồng', 'bình thuận': 'Lâm Đồng', 'phú yên': 'Đắk Lắk',
  'bình dương': 'TP. Hồ Chí Minh', 'bà rịa - vũng tàu': 'TP. Hồ Chí Minh', 'bà rịa – vũng tàu': 'TP. Hồ Chí Minh',
  'bà rịa vũng tàu': 'TP. Hồ Chí Minh', 'sài gòn': 'TP. Hồ Chí Minh', 'hcm': 'TP. Hồ Chí Minh',
  'bình phước': 'Đồng Nai', 'long an': 'Tây Ninh', 'sóc trăng': 'Cần Thơ', 'hậu giang': 'Cần Thơ',
  'bến tre': 'Vĩnh Long', 'trà vinh': 'Vĩnh Long', 'tiền giang': 'Đồng Tháp', 'bạc liêu': 'Cà Mau',
  'kiên giang': 'An Giang',
}

// "TP. Hồ Chí Minh", "Thành phố Hồ Chí Minh", "tỉnh Đồng Nai" → khóa so sánh "hồ chí minh", "đồng nai"
function areaKey(name) {
  return String(name || '').normalize('NFC').toLocaleLowerCase('vi-VN')
    .replace(/^(thành phố|tp\.?|tỉnh)\s*/, '').replace(/\s+/g, ' ').trim()
}
const AREA_BY_KEY = new Map(ALL_AREAS.map((name) => [areaKey(name), name]))

// Phần cuối của địa điểm → tên tỉnh, thành phố chuẩn (hoặc '' nếu không nhận ra).
export function provinceOf(location) {
  const parts = String(location || '').split(',').map((part) => part.trim()).filter(Boolean)
  const key = areaKey(parts[parts.length - 1])
  return AREA_BY_KEY.get(key) || OLD_AREAS[key] || ''
}

// Khu vực hiển thị = tỉnh, thành phố chuẩn; nếu không nhận ra thì giữ nguyên phần cuối địa điểm.
export function areaOf(location) {
  const parts = String(location || '').split(',').map((part) => part.trim()).filter(Boolean)
  return provinceOf(location) || parts[parts.length - 1] || ''
}

// Form đăng tin: tách "Phường Sài Gòn, TP. Hồ Chí Minh" → { detail: 'Phường Sài Gòn', province: 'TP. Hồ Chí Minh' }
export function splitLocation(location) {
  const parts = String(location || '').split(',').map((part) => part.trim()).filter(Boolean)
  const province = provinceOf(location)
  if (!province) return { detail: parts.join(', '), province: '' }
  return { detail: parts.slice(0, -1).join(', '), province }
}

// ---------- Loại hình công việc (Sprint 5) ----------
export const EMPLOYMENT_TYPES = {
  PART_TIME: { label: 'Bán thời gian', short: 'Part-time' },
  FULL_TIME: { label: 'Toàn thời gian', short: 'Full-time' },
}

export function employmentTypeOf(job) {
  return job?.employmentType === 'FULL_TIME' ? 'FULL_TIME' : 'PART_TIME'
}

// ---------- Khung giờ (Sprint 4) ----------
// API trả về "HH:mm:ss" hoặc "HH:mm"; giao diện chỉ dùng "HH:mm".
export function hhmm(value) {
  return value ? String(value).slice(0, 5) : ''
}

export function toMinutes(value) {
  const text = hhmm(value)
  if (!text) return null
  const [h, m] = text.split(':').map(Number)
  return h * 60 + m
}

// Các mốc 30 phút trong ngày: 00:00, 00:30, ..., 23:30
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  return `${h}:${i % 2 ? '30' : '00'}`
})

export function hasWorkTime(job) {
  return Boolean(job.startTime && job.endTime)
}

export function workTimeLabel(job) {
  return hasWorkTime(job) ? `${hhmm(job.startTime)} – ${hhmm(job.endTime)}` : 'Giờ linh hoạt'
}

// Ca làm theo giờ bắt đầu: dùng để tô màu thanh thời gian.
export function periodOf(job) {
  const start = toMinutes(job.startTime)
  if (start === null) return 'flex'
  if (start < 12 * 60) return 'morning'
  if (start < 18 * 60) return 'afternoon'
  return 'evening'
}

// Sinh viên rảnh từ `from` đến `to`: chỉ giữ việc nằm gọn trong khung giờ đó.
// Việc "giờ linh hoạt" (không có giờ cố định) được giữ lại nếu includeFlexible = true.
export function fitsWindow(job, from, to, includeFlexible) {
  if (!from || !to) return true
  if (!hasWorkTime(job)) return includeFlexible
  return toMinutes(job.startTime) >= toMinutes(from) && toMinutes(job.endTime) <= toMinutes(to)
}

export const SHIFTS = [
  { key: 'morning', label: 'Ca sáng', from: '06:00', to: '12:00' },
  { key: 'afternoon', label: 'Ca chiều', from: '12:00', to: '18:00' },
  { key: 'evening', label: 'Ca tối', from: '17:00', to: '23:00' },
]

// ---------- Ngành nghề ----------
const INDUSTRY_LOOK = [
  { match: /ăn uống|cà phê|nhà hàng|f&b/i, icon: 'cup', tone: 'coral' },
  { match: /giáo dục|gia sư|education/i, icon: 'book', tone: 'cobalt' },
  { match: /bán lẻ|bán hàng|retail/i, icon: 'bag', tone: 'amber' },
  { match: /văn phòng|nhập liệu|office/i, icon: 'briefcase', tone: 'teal' },
  { match: /marketing|quảng cáo/i, icon: 'megaphone', tone: 'pink' },
  { match: /sự kiện|event/i, icon: 'ticket', tone: 'violet' },
  { match: /truyền thông|ảnh|media/i, icon: 'camera', tone: 'navy' },
]

export function industryLook(industry) {
  return INDUSTRY_LOOK.find((item) => item.match.test(industry || '')) || { icon: 'briefcase', tone: 'slate' }
}
