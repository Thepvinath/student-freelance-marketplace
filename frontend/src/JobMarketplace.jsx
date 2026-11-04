import { useEffect, useMemo, useState } from 'react'
import ApplicationCenter, { ApplyJobModal } from './ApplicationCenter.jsx'

const EMPTY_JOB = {
  title: '',
  description: '',
  industry: '',
  location: '',
  salaryMin: '',
  salaryMax: '',
  workSchedule: '',
}

const currency = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

function salaryLabel(job) {
  return `${currency.format(Number(job.salaryMin))} – ${currency.format(Number(job.salaryMax))} ₫`
}

function friendlyError(status) {
  if (status === 400) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.'
  if (status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy tin tuyển dụng hoặc bạn không phải chủ sở hữu.'
  if (status === 409) return 'Trạng thái công việc không cho phép thực hiện thao tác này.'
  return `Yêu cầu thất bại (HTTP ${status}). Vui lòng thử lại.`
}

async function callApi(path, { method = 'GET', token, body, signal } = {}) {
  const response = await fetch(path, {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) throw new Error(friendlyError(response.status))
  if (response.status === 204) return null
  return response.json()
}

function JobCard({ job, onOpen, showActions, onEdit, onFill, busy }) {
  const isOpen = job.jobStatus === 'OPEN'
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="job-avatar" aria-hidden="true">{(job.industry || 'J').slice(0, 1).toUpperCase()}</div>
        <span className={`status-pill ${isOpen ? 'status-open' : 'status-filled'}`}>
          {isOpen ? 'Đang tuyển' : job.jobStatus === 'FILLED' ? 'Đã đủ người' : 'Hoàn thành'}
        </span>
      </div>
      <p className="job-industry">{job.industry}</p>
      <h3>{job.title}</h3>
      <p className="job-description">{job.description}</p>
      <div className="job-facts">
        <span>⌖ {job.location}</span>
        <span>◷ {job.workSchedule}</span>
      </div>
      <div className="job-card-bottom">
        <div>
          <small>Thù lao dự kiến</small>
          <strong>{salaryLabel(job)}</strong>
        </div>
        <button type="button" className="outline-button" onClick={() => onOpen(job)}>Chi tiết →</button>
      </div>
      {showActions && isOpen && (
        <div className="job-owner-actions">
          <button type="button" className="text-button" disabled={busy} onClick={() => onEdit(job)}>Chỉnh sửa</button>
          <button type="button" className="text-button warn" disabled={busy} onClick={() => onFill(job)}>Đánh dấu đủ người</button>
        </div>
      )}
    </article>
  )
}

function JobForm({ initial, saving, serverError, onCancel, onSave }) {
  const [values, setValues] = useState(initial)
  const [error, setError] = useState('')

  function update(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function submit(event) {
    event.preventDefault()
    const salaryMin = Number(values.salaryMin)
    const salaryMax = Number(values.salaryMax)
    if (!Number.isFinite(salaryMin) || !Number.isFinite(salaryMax) || salaryMin < 0 || salaryMin > salaryMax) {
      setError('Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu.')
      return
    }
    setError('')
    onSave({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      industry: values.industry.trim(),
      location: values.location.trim(),
      workSchedule: values.workSchedule.trim(),
      salaryMin,
      salaryMax,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel()
    }}>
      <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="job-form-title">
        <div className="modal-heading">
          <div>
            <p className="section-kicker">BẢNG ĐIỀU KHIỂN NHÀ TUYỂN DỤNG</p>
            <h2 id="job-form-title">{initial.id ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}</h2>
          </div>
          <button type="button" aria-label="Đóng" onClick={onCancel} disabled={saving} className="close-button">×</button>
        </div>
        <form onSubmit={submit} className="job-edit-form">
          <div className="field"><label htmlFor="job-title">Tên công việc</label><input id="job-title" name="title" value={values.title} onChange={update} maxLength={200} required placeholder="Ví dụ: Trợ lý sự kiện bán thời gian" /></div>
          <div className="field"><label htmlFor="job-desc">Mô tả công việc</label><textarea id="job-desc" name="description" value={values.description} onChange={update} required rows={4} placeholder="Mô tả nhiệm vụ và yêu cầu..." /></div>
          <div className="form-two-cols">
            <div className="field"><label htmlFor="job-industry">Lĩnh vực</label><input id="job-industry" name="industry" value={values.industry} onChange={update} maxLength={100} required placeholder="Education" /></div>
            <div className="field"><label htmlFor="job-location">Địa điểm</label><input id="job-location" name="location" value={values.location} onChange={update} maxLength={200} required placeholder="TP. Hồ Chí Minh" /></div>
            <div className="field"><label htmlFor="job-min">Thù lao tối thiểu (VNĐ)</label><input id="job-min" name="salaryMin" type="number" min="0" max="9999999999.99" step="0.01" value={values.salaryMin} onChange={update} required placeholder="40000" /></div>
            <div className="field"><label htmlFor="job-max">Thù lao tối đa (VNĐ)</label><input id="job-max" name="salaryMax" type="number" min="0" max="9999999999.99" step="0.01" value={values.salaryMax} onChange={update} required placeholder="60000" /></div>
          </div>
          <div className="field"><label htmlFor="job-hours">Lịch làm việc</label><input id="job-hours" name="workSchedule" value={values.workSchedule} onChange={update} maxLength={255} required placeholder="Thứ 2–6, 4 giờ/ngày" /></div>
          {(error || serverError) && <p className="form-error" role="alert">{error || serverError}</p>}
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onCancel} disabled={saving}>Hủy</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Đang lưu...' : initial.id ? 'Lưu thay đổi' : 'Đăng công việc →'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function JobMarketplace({ session, onLogout }) {
  const employer = session.role === 'EMPLOYER'
  const [view, setView] = useState('explore')
  const [allJobs, setAllJobs] = useState([])
  const [mine, setMine] = useState([])
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('all')
  const [selected, setSelected] = useState(null)
  const [applying, setApplying] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function loadJobs() {
      try {
        const [publicJobs, ownJobs] = await Promise.all([
          callApi('/api/jobs', { signal: controller.signal }),
          employer ? callApi('/api/jobs/mine', { token: session.accessToken, signal: controller.signal }) : Promise.resolve([]),
        ])
        if (controller.signal.aborted) return
        setAllJobs(publicJobs)
        setMine(ownJobs)
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof TypeError ? 'Không thể kết nối Spring Boot ở cổng 8080.' : err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadJobs()
    return () => controller.abort()
  }, [employer, refreshKey, session.accessToken])

  const list = view === 'mine' && employer ? mine : allJobs
  const industries = useMemo(() => [...new Set(list.map((j) => j.industry).filter(Boolean))].sort(), [list])
  const visible = useMemo(() => list.filter((job) => {
    const haystack = `${job.title} ${job.description} ${job.industry} ${job.location}`.toLocaleLowerCase('vi-VN')
    return haystack.includes(query.toLocaleLowerCase('vi-VN').trim()) && (industry === 'all' || job.industry === industry)
  }), [list, query, industry])

  function switchView(next) {
    setView(next)
    setIndustry('all')
    setQuery('')
    setSelected(null)
    setError('')
    setNotice('')
  }

  function refresh() {
    setLoading(true)
    setError('')
    setRefreshKey((current) => current + 1)
  }

  function startCreate() {
    setEditing({ ...EMPTY_JOB })
    setFormOpen(true)
    setError('')
  }

  function startEdit(job) {
    setEditing({
      ...job,
      salaryMin: String(job.salaryMin),
      salaryMax: String(job.salaryMax),
    })
    setFormOpen(true)
    setError('')
  }

  async function saveJob(payload) {
    setSaving(true)
    setError('')
    try {
      const update = Boolean(editing.id)
      await callApi(update ? `/api/jobs/${editing.id}` : '/api/jobs', {
        method: update ? 'PUT' : 'POST',
        token: session.accessToken,
        body: payload,
      })
      setFormOpen(false)
      setEditing(null)
      setSelected(null)
      setNotice(update ? 'Đã cập nhật tin tuyển dụng.' : 'Đăng tin thành công! Tin đang ở trạng thái OPEN.')
      setView('mine')
      setQuery('')
      setIndustry('all')
      refresh()
    } catch (err) {
      setError(err instanceof TypeError ? 'Không thể kết nối Spring Boot.' : err.message)
      // Show a form-scoped error as well; the dialog remains open.
    } finally {
      setSaving(false)
    }
  }

  async function fillJob(job) {
    if (!window.confirm(`Đánh dấu “${job.title}” là đã đủ người? Hành động này không thể sửa lại qua giao diện hiện tại.`)) return
    setSaving(true)
    setError('')
    try {
      await callApi(`/api/jobs/${job.id}/fill`, { method: 'PATCH', token: session.accessToken })
      setSelected(null)
      setNotice('Đã chuyển trạng thái tin tuyển dụng sang FILLED.')
      refresh()
    } catch (err) {
      setError(err instanceof TypeError ? 'Không thể kết nối Spring Boot.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  const myOpen = mine.filter((j) => j.jobStatus === 'OPEN').length

  return (
    <div className="marketplace-app dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand"><span className="site-logo">SF</span><span>Student Freelance <b>Marketplace</b></span></div>
          <nav className="dashboard-nav" aria-label="Điều hướng">
            <button type="button" className={view === 'explore' ? 'active' : ''} onClick={() => switchView('explore')}>Khám phá việc làm</button>
            {employer && <button type="button" className={view === 'mine' ? 'active' : ''} onClick={() => switchView('mine')}>Tin tuyển dụng của tôi</button>}
            {employer ? <button type="button" className={view === 'candidates' ? 'active' : ''} onClick={() => switchView('candidates')}>Đơn ứng tuyển</button> : <button type="button" className={view === 'applications' ? 'active' : ''} onClick={() => switchView('applications')}>Ứng tuyển của tôi</button>}
          </nav>
          <div className="dashboard-account"><span className="role-label">{employer ? 'Nhà tuyển dụng' : session.role === 'STUDENT' ? 'Sinh viên' : 'Quản trị viên'}</span><span className="profile-initial" title={session.email}>{session.fullName?.slice(0, 1).toUpperCase() || '?'}</span><button type="button" className="signout-button" onClick={onLogout}>Đăng xuất</button></div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy"><span className="hero-eyebrow">STUDENT FREELANCE MARKETPLACE</span><h1>{employer ? 'Kết nối với nhân tài trẻ.' : 'Tìm cơ hội dành cho bạn.'}</h1><p>{employer ? 'Đăng tin và quản lý cơ hội việc làm dành cho sinh viên trên một nền tảng duy nhất.' : 'Khám phá công việc bán thời gian và dự án phù hợp với lịch trình của bạn.'}</p><div className="hero-greeting">Xin chào, <strong>{session.fullName}</strong> 👋</div></div>
          <div className="hero-stats"><div><strong>{allJobs.length}</strong><span>Công việc đang mở</span></div><div><strong>{employer ? mine.length : '01'}</strong><span>{employer ? 'Tin của bạn' : 'Nền tảng việc làm'}</span></div>{employer && <div><strong>{myOpen}</strong><span>Tin còn tuyển</span></div>}</div>
        </section>

        <div className="content-layout">
          <section className="jobs-section">
            {(view === 'applications' || view === 'candidates') ? (
              <ApplicationCenter session={session} employer={employer} jobs={mine} notice={notice} />
            ) : (<>
            <div className="section-title-row"><div><p className="section-kicker">{view === 'mine' ? 'QUẢN LÝ TUYỂN DỤNG' : 'CƠ HỘI MỚI NHẤT'}</p><h2>{view === 'mine' ? 'Tin tuyển dụng của tôi' : 'Khám phá việc làm'}</h2><p>{view === 'mine' ? 'Xem, chỉnh sửa và quản lý trạng thái các tin đã đăng.' : 'Danh sách tin đang mở từ Spring Boot và MySQL.'}</p></div>{employer && <button type="button" className="primary-button create-job-button" onClick={startCreate}>+ Đăng tin mới</button>}</div>
            <div className="jobs-toolbar"><label className="search-wrap"><span aria-hidden="true">⌕</span><input type="search" aria-label="Tìm công việc" placeholder="Tìm theo tên việc, lĩnh vực, địa điểm..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Lọc theo lĩnh vực" value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="all">Tất cả lĩnh vực</option>{industries.map((item) => <option key={item} value={item}>{item}</option>)}</select><button type="button" className="refresh-button" onClick={refresh} disabled={loading}>↻ Làm mới</button></div>
            {error && <p className="form-error dashboard-message" role="alert">{error}</p>}
            {notice && <p className="form-notice dashboard-message" role="status">{notice}</p>}
            <div className="result-header"><strong>{loading ? 'Đang tải...' : `${visible.length} kết quả`}</strong><span>{view === 'mine' ? 'Tất cả trạng thái' : 'Chỉ hiển thị việc đang tuyển'}</span></div>
            {loading ? <div className="jobs-empty"><div className="empty-icon">↻</div><h3>Đang tải việc làm...</h3><p>Đang lấy dữ liệu từ Spring Boot.</p></div> : visible.length === 0 ? (
              <div className="jobs-empty"><div className="empty-icon">⌕</div><h3>{query || industry !== 'all' ? 'Không tìm thấy kết quả' : view === 'mine' ? 'Bạn chưa đăng tin nào' : 'Chưa có công việc đang tuyển'}</h3><p>{query || industry !== 'all' ? 'Hãy thử từ khóa hoặc bộ lọc khác.' : view === 'mine' ? 'Tạo tin tuyển dụng đầu tiên để bắt đầu.' : 'Tin thử nghiệm trước đó đã chuyển sang FILLED, nên không xuất hiện ở đây.'}</p>{employer && !(query || industry !== 'all') && <button type="button" className="primary-button empty-cta" onClick={startCreate}>+ Đăng tin tuyển dụng</button>}</div>
            ) : <div className="job-grid">{visible.map((job) => <JobCard key={job.id} job={job} onOpen={setSelected} showActions={view === 'mine' && employer} onEdit={startEdit} onFill={fillJob} busy={saving} />)}</div>}
            </>)}
          </section>
          <aside className="dashboard-sidebar"><div className="side-card"><span className="side-icon">✦</span><h3>{employer ? 'Đăng tuyển nhanh' : 'Bắt đầu hành trình'}</h3><p>{employer ? 'Tạo tin tuyển dụng với đầy đủ mô tả, thời gian và mức thù lao.' : 'Tìm kiếm cơ hội việc làm mới, phù hợp với kỹ năng của bạn.'}</p>{employer ? <button className="side-link" type="button" onClick={startCreate}>Tạo tin ngay →</button> : <button className="side-link" type="button" onClick={() => switchView('explore')}>Khám phá việc làm →</button>}</div><div className="side-card side-card-white"><h3>Tài khoản của bạn</h3><dl><div><dt>Họ tên</dt><dd>{session.fullName}</dd></div><div><dt>Email</dt><dd>{session.email}</dd></div><div><dt>Vai trò</dt><dd>{session.role}</dd></div></dl><p className="session-note">Phiên JWT hiện lưu trong bộ nhớ. Tải lại trang sẽ yêu cầu đăng nhập lại.</p></div></aside>
        </div>
      </main>
      <footer className="dashboard-footer">© Student Freelance Marketplace · ReactJS + Spring Boot + MySQL</footer>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section role="dialog" aria-modal="true" aria-labelledby="job-detail-title" className="job-modal job-detail"><div className="modal-heading"><div><p className="section-kicker">CHI TIẾT CÔNG VIỆC</p><h2 id="job-detail-title">{selected.title}</h2></div><button type="button" className="close-button" aria-label="Đóng" onClick={() => setSelected(null)}>×</button></div><span className={`status-pill ${selected.jobStatus === 'OPEN' ? 'status-open' : 'status-filled'}`}>{selected.jobStatus}</span><div className="job-detail-info"><div><small>Lĩnh vực</small><strong>{selected.industry}</strong></div><div><small>Địa điểm</small><strong>{selected.location}</strong></div><div><small>Thù lao dự kiến</small><strong>{salaryLabel(selected)}</strong></div><div><small>Lịch làm việc</small><strong>{selected.workSchedule}</strong></div></div><h3>Mô tả công việc</h3><p className="detail-description">{selected.description}</p><div className="application-apply-actions">{!employer && session.role === 'STUDENT' && selected.jobStatus === 'OPEN' && <button type="button" className="primary-button" onClick={() => { setApplying(selected); setSelected(null) }}>Ứng tuyển ngay →</button>}<button type="button" className="outline-button" onClick={() => setSelected(null)}>Đóng chi tiết</button></div></section></div>}
      {applying && <ApplyJobModal job={applying} token={session.accessToken} onCancel={() => setApplying(null)} onSuccess={() => { setApplying(null); setNotice('Đã gửi đơn ứng tuyển thành công.'); switchView('applications'); setNotice('Đã gửi đơn ứng tuyển thành công.'); }} />}
      {formOpen && editing && <JobForm key={editing.id || 'new'} initial={editing} saving={saving} serverError={error} onCancel={() => { setFormOpen(false); setEditing(null) }} onSave={saveJob} />}
    </div>
  )
}
