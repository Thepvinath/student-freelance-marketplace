import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

// FR-11: chuông thông báo trên thanh điều hướng.
// Đếm thông báo chưa đọc mỗi 30 giây; mở chuông để xem 50 thông báo mới nhất.
const POLL_MS = 30000

async function notificationApi(path, token, { method = 'GET', signal } = {}) {
  const response = await fetch(path, { method, signal, headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function timeAgo(value) {
  const at = Date.parse(value || '')
  if (!Number.isFinite(at)) return ''
  const minutes = Math.max(0, Math.round((Date.now() - at) / 60000))
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.round(hours / 24)} ngày trước`
}

export default function NotificationBell({ token, onOpenItem }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = () => notificationApi('/api/notifications/unread-count', token, { signal: controller.signal })
      .then((data) => setUnread(Number(data.unread) || 0))
      .catch(() => {
        // Bỏ qua lỗi mạng tạm thời; lần kiểm tra sau sẽ thử lại.
      })
    load()
    const timer = setInterval(load, POLL_MS)
    return () => { controller.abort(); clearInterval(timer) }
  }, [token])

  // Đóng khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return undefined
    function onDown(event) { if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false) }
    function onKey(event) { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (!next) return
    setError('')
    try {
      const data = await notificationApi('/api/notifications', token)
      setItems(data)
      setUnread(data.filter((n) => !n.read).length)
    } catch {
      setError('Không tải được thông báo. Thử lại sau.')
    }
  }

  async function openItem(item) {
    if (!item.read) {
      try {
        await notificationApi(`/api/notifications/${item.id}/read`, token, { method: 'PATCH' })
        setItems((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
        setUnread((count) => Math.max(0, count - 1))
      } catch {
        // Vẫn chuyển trang dù đánh dấu đã đọc thất bại.
      }
    }
    setOpen(false)
    onOpenItem(item)
  }

  async function readAll() {
    try {
      await notificationApi('/api/notifications/read-all', token, { method: 'PATCH' })
      setItems((current) => (current || []).map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch {
      setError('Không cập nhật được. Thử lại sau.')
    }
  }

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button type="button" className={`bell-button ${open ? 'open' : ''}`} onClick={toggle} aria-expanded={open} aria-haspopup="true" aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}>
        <Icon name="bell" size={20} />
        {unread > 0 && <span className="bell-count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="bell-panel" role="dialog" aria-label="Thông báo">
          <div className="bell-head">
            <strong>Thông báo</strong>
            <button type="button" className="text-button" onClick={readAll} disabled={!items?.some((n) => !n.read)}>Đánh dấu tất cả đã đọc</button>
          </div>
          {error && <p className="form-error bell-error">{error}</p>}
          {!items && !error && <p className="bell-empty">Đang tải...</p>}
          {items && items.length === 0 && <p className="bell-empty">Chưa có thông báo nào. Khi đơn ứng tuyển thay đổi trạng thái, bạn sẽ thấy ở đây.</p>}
          {items && items.length > 0 && (
            <ul className="bell-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button type="button" className={item.read ? '' : 'unread'} onClick={() => openItem(item)}>
                    <span className="bell-dot" aria-hidden="true" />
                    <span className="bell-text">{item.message}<small>{timeAgo(item.createdAt)}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
