// Tiện ích dùng chung cho trang việc làm (định dạng tiền, khu vực, khung giờ).

const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

export function money(value) {
  return `${currency.format(Number(value))} ₫`
}

export function salaryLabel(job) {
  return `${currency.format(Number(job.salaryMin))} – ${currency.format(Number(job.salaryMax))} ₫`
}

// Khu vực = phần cuối của địa điểm, ví dụ "Quận 7, TP. Hồ Chí Minh" -> "TP. Hồ Chí Minh".
export function areaOf(location) {
  const parts = String(location || '').split(',').map((part) => part.trim()).filter(Boolean)
  return parts[parts.length - 1] || ''
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
