import { useState } from 'react'
import './App.css'
import JobMarketplace from './JobMarketplace.jsx'

const INITIAL_FORM = {
  fullName: '',
  email: '',
  password: '',
  role: 'STUDENT',
}

function apiError(status, mode) {
  if (status === 409) return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.'
  if (status === 401) return 'Email hoặc mật khẩu không đúng.'
  if (status === 403) return 'Tài khoản không được phép truy cập.'
  if (status === 400) return 'Thông tin không hợp lệ. Vui lòng kiểm tra các trường đã nhập.'
  return `${mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} không thành công (HTTP ${status}). Vui lòng thử lại.`
}

function App() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(INITIAL_FORM)
  const [session, setSession] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
    setForm((current) => ({ ...current, password: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')

    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const payload = mode === 'login'
      ? { email: form.email.trim(), password: form.password }
      : {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(apiError(response.status, mode))
      const data = await response.json()

      if (mode === 'login') {
        if (!data.accessToken) throw new Error('Máy chủ không trả về JWT. Vui lòng kiểm tra API.')
        // Keep the JWT in React memory only for this demo; never print it to the UI.
        setSession(data)
        setForm((current) => ({ ...current, password: '' }))
      } else {
        setForm({ ...INITIAL_FORM, email: data.email || form.email.trim() })
        setMode('login')
        setNotice('Đăng ký thành công! Hãy đăng nhập để tiếp tục.')
      }
    } catch (caught) {
      setError(caught instanceof TypeError
        ? 'Không thể kết nối máy chủ. Hãy kiểm tra Spring Boot ở cổng 8080.'
        : caught.message)
    } finally {
      setBusy(false)
    }
  }

  function signOut() {
    setSession(null)
    setForm(INITIAL_FORM)
    setError('')
    setNotice('Bạn đã đăng xuất khỏi giao diện này.')
    setMode('login')
  }

  if (session) {
    return <JobMarketplace session={session} onLogout={signOut} />
  }

  return (
    <div className="marketplace-auth">
      <header className="site-header">
        <div className="site-logo" aria-hidden="true">SF</div>
        <div className="site-name">Student Freelance <span>Marketplace</span></div>
        <div className="site-tagline">Nền tảng kết nối sinh viên & nhà tuyển dụng</div>
      </header>

      <main className="auth-layout">
        <aside className="intro-pane">
          <div className="intro-content">
            <span className="eyebrow">CƠ HỘI BẮT ĐẦU TỪ ĐÂY</span>
            <h1>Khám phá công việc.<br /><em>Phát triển tương lai.</em></h1>
            <p>Tìm việc làm thêm, dự án freelance và kết nối với những nhà tuyển dụng phù hợp với bạn.</p>
            <div className="intro-features">
              <div><span className="feature-icon">01</span><span>Khám phá công việc phù hợp</span></div>
              <div><span className="feature-icon">02</span><span>Kết nối trực tiếp với nhà tuyển dụng</span></div>
              <div><span className="feature-icon">03</span><span>Quản lý hồ sơ và cơ hội nghề nghiệp</span></div>
            </div>
          </div>
          <div className="intro-art" aria-hidden="true"><div className="art-orbit"><span>SF</span></div></div>
          <div className="intro-bottom">Student Freelance Marketplace · Academic Project</div>
        </aside>

        <section className="form-pane">
          <div className="auth-form-wrap">
              <div className="form-heading">
                <p className="section-kicker">CHÀO MỪNG BẠN</p>
                <h2>{mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}</h2>
                <p className="section-description">
                  {mode === 'login' ? 'Đăng nhập để tiếp tục hành trình của bạn.' : 'Chọn vai trò của bạn để bắt đầu.'}
                </p>
              </div>

              <div className="mode-tabs" aria-label="Chọn hình thức truy cập">
                <button type="button" className={mode === 'login' ? 'active' : ''} aria-pressed={mode === 'login'} onClick={() => changeMode('login')}>Đăng nhập</button>
                <button type="button" className={mode === 'register' ? 'active' : ''} aria-pressed={mode === 'register'} onClick={() => changeMode('register')}>Đăng ký</button>
              </div>

              {notice && <p className="form-notice" role="status">{notice}</p>}
              {error && <p className="form-error" role="alert">{error}</p>}

              <form onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <div className="field">
                    <label htmlFor="fullName">Họ và tên</label>
                    <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Nguyễn Văn A" required maxLength={150} value={form.fullName} onChange={updateField} />
                  </div>
                )}
                <div className="field">
                  <label htmlFor="email">Địa chỉ email</label>
                  <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required value={form.email} onChange={updateField} />
                </div>
                <div className="field">
                  <label htmlFor="password">Mật khẩu</label>
                  <input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Nhập mật khẩu của bạn" required minLength={mode === 'register' ? 8 : undefined} maxLength={mode === 'register' ? 72 : undefined} value={form.password} onChange={updateField} />
                  {mode === 'register' && <small>Ít nhất 8 ký tự, tối đa 72 ký tự.</small>}
                </div>
                {mode === 'register' && (
                  <fieldset className="roles">
                    <legend>Bạn là ai?</legend>
                    <div className="role-options">
                      <label className={form.role === 'STUDENT' ? 'role-option selected' : 'role-option'}>
                        <input type="radio" name="role" value="STUDENT" checked={form.role === 'STUDENT'} onChange={updateField} />
                        <span><strong>Sinh viên</strong><small>Tìm việc làm thêm</small></span>
                      </label>
                      <label className={form.role === 'EMPLOYER' ? 'role-option selected' : 'role-option'}>
                        <input type="radio" name="role" value="EMPLOYER" checked={form.role === 'EMPLOYER'} onChange={updateField} />
                        <span><strong>Nhà tuyển dụng</strong><small>Đăng tin tuyển dụng</small></span>
                      </label>
                    </div>
                  </fieldset>
                )}
                <button className="primary-button" type="submit" disabled={busy}>
                  {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  {!busy && <span aria-hidden="true">→</span>}
                </button>
              </form>

              <p className="form-footer">
                {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
                <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
                  {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>
            </div>
        </section>
      </main>
      <footer className="site-footer">© Student Freelance Marketplace · ReactJS + Spring Boot + MySQL</footer>
    </div>
  )
}

export default App
