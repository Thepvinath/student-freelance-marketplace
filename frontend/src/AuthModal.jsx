import { useState } from 'react'
import Icon from './Icon.jsx'

// FR-01, FR-02: Đăng nhập / Đăng ký hiển thị dạng hộp thoại trên trang chủ.
// Khách vẫn xem việc làm; chỉ cần đăng nhập khi ứng tuyển hoặc đăng tin.

function apiError(status, mode) {
  if (status === 409) return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.'
  if (status === 401) return 'Email hoặc mật khẩu không đúng.'
  if (status === 403) return 'Tài khoản không được phép truy cập.'
  if (status === 400) return 'Thông tin chưa hợp lệ. Kiểm tra lại các ô đã nhập.'
  return `${mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} không thành công (HTTP ${status}). Hãy thử lại.`
}

export default function AuthModal({ initialMode = 'login', initialRole = 'STUDENT', reason = '', onClose, onLoggedIn }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: initialRole })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
    setForm((current) => ({ ...current, password: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    const login = mode === 'login'
    const payload = login
      ? { email: form.email.trim(), password: form.password }
      : { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, role: form.role }

    try {
      const response = await fetch(login ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(apiError(response.status, mode))
      const data = await response.json()
      if (login) {
        if (!data.accessToken) throw new Error('Máy chủ không trả về JWT. Kiểm tra lại API đăng nhập.')
        // JWT chỉ giữ trong bộ nhớ React, không hiển thị ra giao diện.
        onLoggedIn(data)
      } else {
        setForm((current) => ({ ...current, fullName: '', password: '', email: data.email || current.email.trim() }))
        setMode('login')
        setNotice('Đã tạo tài khoản. Đăng nhập để tiếp tục.')
      }
    } catch (caught) {
      setError(caught instanceof TypeError ? 'Không kết nối được máy chủ. Kiểm tra Spring Boot ở cổng 8080.' : caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <aside className="auth-side">
          <div className="brand-mark light">SF</div>
          <h2>{mode === 'login' ? 'Chào bạn quay lại' : 'Tham gia cùng sinh viên Việt Nam'}</h2>
          <p>Tìm ca làm thêm theo giờ rảnh, ứng tuyển bằng hồ sơ có sẵn và theo dõi kết quả ở một nơi.</p>
          <ul>
            <li><Icon name="clock" size={18} />Lọc việc theo khung giờ bạn chọn</li>
            <li><Icon name="check" size={18} />Một lần ứng tuyển cho mỗi tin, trạng thái rõ ràng</li>
            <li><Icon name="user" size={18} />Nhà tuyển dụng xem hồ sơ và CV (PDF) của bạn</li>
          </ul>
        </aside>

        <div className="auth-main">
          <button type="button" className="close-button" aria-label="Đóng" onClick={onClose} disabled={busy}><Icon name="close" size={18} /></button>
          <h2 id="auth-title">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          {reason && <p className="auth-reason">{reason}</p>}

          <div className="mode-tabs" role="tablist" aria-label="Chọn hình thức">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Đăng nhập</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Đăng ký</button>
          </div>

          {notice && <p className="form-notice" role="status">{notice}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <div className="field">
                <label htmlFor="fullName">Họ và tên</label>
                <input id="fullName" name="fullName" autoComplete="name" placeholder="Nguyễn Văn A" required maxLength={150} value={form.fullName} onChange={update} />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="ban@example.com" required value={form.email} onChange={update} autoFocus />
            </div>
            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Nhập mật khẩu" required minLength={mode === 'register' ? 8 : undefined} maxLength={mode === 'register' ? 72 : undefined} value={form.password} onChange={update} />
              {mode === 'register' && <small>Từ 8 đến 72 ký tự.</small>}
            </div>
            {mode === 'register' && (
              <fieldset className="roles">
                <legend>Bạn đăng ký với vai trò</legend>
                <div className="role-options">
                  <label className={form.role === 'STUDENT' ? 'role-option selected' : 'role-option'}>
                    <input type="radio" name="role" value="STUDENT" checked={form.role === 'STUDENT'} onChange={update} />
                    <span><strong>Sinh viên</strong><small>Tìm việc làm thêm</small></span>
                  </label>
                  <label className={form.role === 'EMPLOYER' ? 'role-option selected' : 'role-option'}>
                    <input type="radio" name="role" value="EMPLOYER" checked={form.role === 'EMPLOYER'} onChange={update} />
                    <span><strong>Nhà tuyển dụng</strong><small>Đăng tin tuyển ca</small></span>
                  </label>
                </div>
              </fieldset>
            )}
            <button className="primary-button wide" type="submit" disabled={busy}>
              {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</button>
          </p>
        </div>
      </section>
    </div>
  )
}
