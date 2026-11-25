// Sprint 5: CV dạng file PDF (≤ 5 MB) – sinh viên chọn file thay vì dán liên kết.
// File được lưu trên máy chủ, đường dẫn dạng "/api/files/cv/{id}" và chỉ xem được khi đăng nhập
// (chủ CV, nhà tuyển dụng nhận đơn, Quản trị viên).

export const MAX_CV_BYTES = 5 * 1024 * 1024

const UPLOAD_ERRORS = {
  400: 'Chưa chọn file CV.',
  401: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại rồi thử lại.',
  403: 'Chỉ tài khoản Sinh viên được tải CV lên.',
  413: 'File CV quá lớn, tối đa 5 MB.',
  415: 'File không phải PDF. Hãy lưu CV dưới dạng PDF rồi chọn lại.',
}

const VIEW_ERRORS = {
  401: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để xem CV.',
  403: 'Tài khoản của bạn không được xem CV này.',
  404: 'Không tìm thấy CV hoặc bạn không có quyền xem.',
}

export function isUploadedCv(url) {
  return /^\/api\/files\/cv\/\d+$/.test(String(url || ''))
}

export function externalCvLink(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export async function uploadCv(file, token) {
  if (!file) throw new Error(UPLOAD_ERRORS[400])
  const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!pdf) throw new Error(UPLOAD_ERRORS[415])
  if (file.size > MAX_CV_BYTES) throw new Error(UPLOAD_ERRORS[413])
  const form = new FormData()
  form.append('file', file)
  let response
  try {
    response = await fetch('/api/files/cv', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  } catch {
    throw new Error('Không kết nối được máy chủ. Thử lại sau.')
  }
  if (!response.ok) throw new Error(UPLOAD_ERRORS[response.status] || `Tải CV thất bại (HTTP ${response.status}).`)
  return response.json()
}

// Mở CV đã tải lên trong tab mới. Tab được mở ngay khi bấm (tránh trình duyệt chặn popup),
// sau đó mới nạp file kèm token đăng nhập.
export async function openUploadedCv(url, token) {
  const tab = window.open('', '_blank')
  if (tab) tab.document.title = 'Đang mở CV...'
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) throw new Error(VIEW_ERRORS[response.status] || `Không mở được CV (HTTP ${response.status}).`)
    const blobUrl = URL.createObjectURL(await response.blob())
    if (tab) tab.location.href = blobUrl
    else window.location.assign(blobUrl)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  } catch (error) {
    if (tab) tab.close()
    throw error instanceof TypeError ? new Error('Không kết nối được máy chủ.') : error
  }
}
