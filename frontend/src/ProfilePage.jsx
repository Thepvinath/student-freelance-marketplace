import { useEffect, useState } from 'react'

// WF-07 · FR-04 – Quản lý hồ sơ cá nhân
// API: GET / PUT /api/profile/me (chỉ hồ sơ của tài khoản đang đăng nhập)

const ERROR_LABELS = {
  400: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.',
  401: 'Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.',
  403: 'Tài khoản này không có hồ sơ cá nhân.',
}

const PHONE_PATTERN = /^[0-9+()\s.-]{8,20}$/

async function profileApi({ method = 'GET', token, body, signal }) {
  const response = await fetch('/api/profile/me', {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    throw new Error(ERROR_LABELS[response.status] || `Yêu cầu thất bại (HTTP ${response.status}).`)
  }
  return response.json()
}

function connectionMessage(caught) {
  return caught instanceof TypeError ? 'Không thể kết nối Spring Boot ở cổng 8080.' : caught.message
}

function initials(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]
  return letters.toUpperCase()
}

function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// API trả về null cho trường trống; ô nhập cần chuỗi rỗng.
function toFormValues(profile) {
  return {
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    school: profile.school || '',
    major: profile.major || '',
    cvUrl: profile.cvUrl || '',
    introduction: profile.introduction || '',
    organizationName: profile.organizationName || '',
    contactPhone: profile.contactPhone || '',
    description: profile.description || '',
  }
}

function validate(values, student) {
  if (!values.fullName.trim()) return 'Vui lòng nhập họ và tên.'
  const phone = (student ? values.phone : values.contactPhone).trim()
  if (phone && !PHONE_PATTERN.test(phone)) return 'Số điện thoại không hợp lệ (8–20 ký tự, chỉ gồm số và + ( ) - .).'
  if (student && values.cvUrl.trim() && !isHttpUrl(values.cvUrl.trim())) {
    return 'Liên kết CV phải bắt đầu bằng https:// hoặc http://.'
  }
  return ''
}

function ProfileForm({ profile, token, onSaved }) {
  const student = profile.role === 'STUDENT'
  const [values, setValues] = useState(() => toFormValues(profile))
  const [saved, setSaved] = useState(profile)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setNotice('')
  }

  async function submit(event) {
    event.preventDefault()
    const problem = validate(values, student)
    setError(problem)
    setNotice('')
    if (problem) return

    // Chỉ gửi các trường của vai trò hiện tại.
    const body = student
      ? {
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          school: values.school.trim(),
          major: values.major.trim(),
          cvUrl: values.cvUrl.trim(),
          introduction: values.introduction.trim(),
        }
      : {
          fullName: values.fullName.trim(),
          organizationName: values.organizationName.trim(),
          contactPhone: values.contactPhone.trim(),
          description: values.description.trim(),
        }

    setBusy(true)
    try {
      const data = await profileApi({ method: 'PUT', token, body })
      setSaved(data)
      setValues(toFormValues(data))
      setNotice('Đã lưu thay đổi hồ sơ.')
      onSaved(data)
    } catch (caught) {
      setError(connectionMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const displayName = student ? saved.fullName : saved.organizationName || saved.fullName

  return (
    <section className={`profile-card ${student ? 'profile-student' : 'profile-employer'}`}>
      <div className="profile-card-band">{student ? 'HỒ SƠ SINH VIÊN · STUDENT' : 'HỒ SƠ NHÀ TUYỂN DỤNG · EMPLOYER'}</div>
      <div className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">{initials(displayName)}</div>
        <div>
          <h3>{displayName}</h3>
          <p>{student ? 'Sinh viên · Hồ sơ cá nhân' : 'Nhà tuyển dụng · Thông tin đơn vị'}</p>
        </div>
      </div>

      <form className="job-edit-form profile-form" onSubmit={submit} noValidate>
        {student ? (
          <>
            <div className="form-two-cols">
              <div className="field"><label htmlFor="pf-name">Họ và tên</label><input id="pf-name" name="fullName" value={values.fullName} onChange={update} maxLength={150} required /></div>
              <div className="field"><label htmlFor="pf-email">Email</label><input id="pf-email" value={saved.email} disabled /><small>Email đăng nhập, không thể thay đổi.</small></div>
              <div className="field"><label htmlFor="pf-school">Trường</label><input id="pf-school" name="school" value={values.school} onChange={update} maxLength={150} placeholder="ĐH Văn Lang" /></div>
              <div className="field"><label htmlFor="pf-major">Chuyên ngành</label><input id="pf-major" name="major" value={values.major} onChange={update} maxLength={150} placeholder="Công nghệ thông tin" /></div>
              <div className="field"><label htmlFor="pf-phone">Số điện thoại</label><input id="pf-phone" name="phone" type="tel" value={values.phone} onChange={update} maxLength={20} placeholder="09xx xxx xxx" /></div>
              <div className="field"><label htmlFor="pf-cv">Liên kết CV</label><input id="pf-cv" name="cvUrl" type="url" value={values.cvUrl} onChange={update} maxLength={500} placeholder="https://example.com/my-cv.pdf" /><small>Tự động điền khi bạn ứng tuyển.</small></div>
            </div>
            <div className="field"><label htmlFor="pf-intro">Kỹ năng / Giới thiệu</label><textarea id="pf-intro" name="introduction" value={values.introduction} onChange={update} maxLength={2000} rows={4} placeholder="React, Java, giao tiếp..." /></div>
          </>
        ) : (
          <>
            <div className="form-two-cols">
              <div className="field"><label htmlFor="pf-org">Tên đơn vị / Công ty</label><input id="pf-org" name="organizationName" value={values.organizationName} onChange={update} maxLength={200} placeholder="Mekong Café" /></div>
              <div className="field"><label htmlFor="pf-email">Email liên hệ</label><input id="pf-email" value={saved.email} disabled /><small>Email đăng nhập, không thể thay đổi.</small></div>
              <div className="field"><label htmlFor="pf-name">Người liên hệ</label><input id="pf-name" name="fullName" value={values.fullName} onChange={update} maxLength={150} required /><small>Họ và tên của tài khoản.</small></div>
              <div className="field"><label htmlFor="pf-phone">Số điện thoại</label><input id="pf-phone" name="contactPhone" type="tel" value={values.contactPhone} onChange={update} maxLength={20} placeholder="09xx xxx xxx" /></div>
            </div>
            <div className="field"><label htmlFor="pf-desc">Mô tả doanh nghiệp</label><textarea id="pf-desc" name="description" value={values.description} onChange={update} maxLength={2000} rows={4} placeholder="Tuyển dụng việc làm part-time cho sinh viên..." /></div>
          </>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-notice" role="status">{notice}</p>}
        <div className="modal-actions">
          <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </form>
    </section>
  )
}

export default function ProfilePage({ session, onProfileSaved }) {
  const [result, setResult] = useState({ key: '', profile: null, error: '' })
  const [reload, setReload] = useState(0)

  // Gắn kết quả với từng yêu cầu để không hiển thị dữ liệu cũ khi đổi tài khoản.
  const requestKey = `${session.userId}:${reload}`
  const current = result.key === requestKey ? result : null

  useEffect(() => {
    const controller = new AbortController()
    profileApi({ token: session.accessToken, signal: controller.signal })
      .then((profile) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, profile, error: '' })
      })
      .catch((caught) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, profile: null, error: connectionMessage(caught) })
      })
    return () => controller.abort()
  }, [requestKey, session.accessToken])

  return (
    <div className="profile-page">
      <div className="section-title-row">
        <div>
          <p className="section-kicker">TÀI KHOẢN CỦA TÔI</p>
          <h2>Quản lý hồ sơ cá nhân</h2>
          <p>Xem và cập nhật thông tin theo vai trò {session.role === 'STUDENT' ? 'Sinh viên' : 'Nhà tuyển dụng'}.</p>
        </div>
      </div>

      {!current ? (
        <div className="jobs-empty"><div className="empty-icon">↻</div><h3>Đang tải hồ sơ...</h3></div>
      ) : current.error ? (
        <div className="jobs-empty">
          <div className="empty-icon">!</div>
          <h3>Không tải được hồ sơ</h3>
          <p>{current.error}</p>
          <button type="button" className="outline-button profile-retry" onClick={() => setReload((n) => n + 1)}>Thử lại</button>
        </div>
      ) : (
        <ProfileForm key={requestKey} profile={current.profile} token={session.accessToken} onSaved={onProfileSaved} />
      )}
    </div>
  )
}
