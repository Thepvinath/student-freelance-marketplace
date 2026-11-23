import { useEffect, useMemo, useState } from 'react'
import ApplicationCenter, { ApplyJobModal } from './ApplicationCenter.jsx'
import ProfilePage from './ProfilePage.jsx'
import Icon from './Icon.jsx'
import NotificationBell from './NotificationBell.jsx'
import { RatingBadge } from './Reviews.jsx'
import { DayBar, TimeRangeField } from './TimeRange.jsx'
import {
  SHIFTS, areaOf, fitsWindow, hasWorkTime, hhmm, industryLook, periodOf,
  salaryLabel, toMinutes, workTimeLabel,
} from './jobUtils.js'

const EMPTY_JOB = {
  title: '',
  description: '',
  industry: '',
  location: '',
  salaryMin: '',
  salaryMax: '',
  workSchedule: '',
  startTime: '',
  endTime: '',
}

function friendlyError(status) {
  if (status === 400) return 'Dữ liệu chưa hợp lệ. Kiểm tra lại các ô đã nhập.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Đăng xuất rồi đăng nhập lại.'
  if (status === 403) return 'Tài khoản của bạn không có quyền thực hiện thao tác này.'
  if (status === 404) return 'Không tìm thấy tin tuyển dụng hoặc tin không thuộc tài khoản của bạn.'
  if (status === 409) return 'Trạng thái công việc không cho phép thao tác này.'
  return `Yêu cầu thất bại (HTTP ${status}). Hãy thử lại.`
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

// FR-09: OPEN → FILLED → COMPLETED
const JOB_STATUS = {
  OPEN: { label: 'Đang tuyển', className: 'status-open' },
  FILLED: { label: 'Đã đủ người', className: 'status-filled' },
  COMPLETED: { label: 'Hoàn thành', className: 'status-completed' },
}

function statusOf(job) {
  return JOB_STATUS[job.jobStatus] || { label: job.jobStatus, className: 'status-filled' }
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Tin đăng trong 3 ngày gần nhất
function isNew(job) {
  const created = Date.parse(job.createdAt || '')
  return Number.isFinite(created) && Date.now() - created < 3 * 24 * 3600 * 1000
}

function IndustryBadge({ industry, size = 'md' }) {
  const look = industryLook(industry)
  return <span className={`industry-badge tone-${look.tone} ${size}`}><Icon name={look.icon} size={size === 'lg' ? 26 : size === 'sm' ? 18 : 22} /></span>
}

function JobCard({ job, onOpen, onApply, showActions, onEdit, onFill, onComplete, busy, applyLabel }) {
  const isOpen = job.jobStatus === 'OPEN'
  return (
    <article className="job-card">
      <IndustryBadge industry={job.industry} />
      <div className="job-main">
        <div className="job-title-row">
          <h3><button type="button" className="job-title-link" onClick={() => onOpen(job)}>{job.title}</button></h3>
          {showActions && <span className={`status-pill ${statusOf(job).className}`}>{statusOf(job).label}</span>}
          {!showActions && isNew(job) && <span className="new-pill">Mới</span>}
        </div>
        <p className="job-meta">
          <span className="industry-tag">{job.industry}</span>
          <span><Icon name="pin" size={15} />{job.location}</span>
        </p>
        <p className="job-description">{job.description}</p>
        <p className="job-schedule"><Icon name="clock" size={14} />{job.workSchedule}</p>
        {showActions && isOpen && (
          <div className="job-owner-actions">
            <button type="button" className="text-button" disabled={busy} onClick={() => onEdit(job)}>Chỉnh sửa</button>
            <button type="button" className="text-button warn" disabled={busy} onClick={() => onFill(job)}>Đánh dấu đủ người</button>
          </div>
        )}
        {showActions && job.jobStatus === 'FILLED' && (
          <div className="job-owner-actions">
            <button type="button" className="text-button complete" disabled={busy} onClick={() => onComplete(job)}>Đánh dấu hoàn thành</button>
          </div>
        )}
      </div>
      <div className="job-side">
        <div className={`job-time period-text-${periodOf(job)}`}>
          <Icon name="clock" size={15} />
          <strong>{workTimeLabel(job)}</strong>
        </div>
        <DayBar from={job.startTime} to={job.endTime} period={periodOf(job)} />
        <p className="job-salary">{salaryLabel(job)}</p>
        {!showActions && (
          <button type="button" className="apply-button" onClick={() => onApply(job)}>{applyLabel}</button>
        )}
      </div>
    </article>
  )
}

function JobForm({ initial, saving, serverError, onCancel, onSave }) {
  const [values, setValues] = useState(initial)
  const [flexible, setFlexible] = useState(Boolean(initial.id) && !initial.startTime)
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
      setError('Thù lao tối đa phải lớn hơn hoặc bằng thù lao tối thiểu.')
      return
    }
    if (!flexible) {
      if (!values.startTime || !values.endTime) {
        setError('Chọn giờ bắt đầu và giờ kết thúc, hoặc đánh dấu "Giờ linh hoạt".')
        return
      }
      if (toMinutes(values.endTime) <= toMinutes(values.startTime)) {
        setError('Giờ kết thúc phải sau giờ bắt đầu.')
        return
      }
    }
    setError('')
    onSave({
      title: values.title.trim(),
      description: values.description.trim(),
      industry: values.industry.trim(),
      location: values.location.trim(),
      workSchedule: values.workSchedule.trim(),
      salaryMin,
      salaryMax,
      startTime: flexible ? null : values.startTime,
      endTime: flexible ? null : values.endTime,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel()
    }}>
      <section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="job-form-title">
        <div className="modal-heading">
          <h2 id="job-form-title">{initial.id ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}</h2>
          <button type="button" aria-label="Đóng" onClick={onCancel} disabled={saving} className="close-button"><Icon name="close" size={18} /></button>
        </div>
        <form onSubmit={submit} className="job-edit-form">
          <div className="field"><label htmlFor="job-title">Tên công việc</label><input id="job-title" name="title" value={values.title} onChange={update} maxLength={200} required placeholder="Ví dụ: Phục vụ quán cà phê ca chiều" /></div>
          <div className="field"><label htmlFor="job-desc">Mô tả công việc</label><textarea id="job-desc" name="description" value={values.description} onChange={update} required rows={4} placeholder="Nhiệm vụ, yêu cầu, quyền lợi..." /></div>
          <div className="form-two-cols">
            <div className="field"><label htmlFor="job-industry">Ngành nghề</label><input id="job-industry" name="industry" value={values.industry} onChange={update} maxLength={100} required placeholder="Dịch vụ ăn uống" /></div>
            <div className="field"><label htmlFor="job-location">Địa điểm</label><input id="job-location" name="location" value={values.location} onChange={update} maxLength={200} required placeholder="Quận 3, TP. Hồ Chí Minh" /></div>
            <div className="field"><label htmlFor="job-min">Thù lao tối thiểu (VNĐ)</label><input id="job-min" name="salaryMin" type="number" min="0" max="9999999999.99" step="0.01" value={values.salaryMin} onChange={update} required placeholder="25000" /></div>
            <div className="field"><label htmlFor="job-max">Thù lao tối đa (VNĐ)</label><input id="job-max" name="salaryMax" type="number" min="0" max="9999999999.99" step="0.01" value={values.salaryMax} onChange={update} required placeholder="30000" /></div>
          </div>
          <div className="field">
            <span className="field-label" id="job-time-label">Khung giờ làm việc</span>
            <div className="time-field-row">
              <TimeRangeField id="job-time" value={{ from: flexible ? '' : values.startTime, to: flexible ? '' : values.endTime }} anyLabel="--:--" onChange={(range) => { setFlexible(false); setValues((current) => ({ ...current, startTime: range.from, endTime: range.to })) }} />
              <label className="check-inline"><input type="checkbox" checked={flexible} onChange={(event) => setFlexible(event.target.checked)} />Giờ linh hoạt</label>
            </div>
            <small>Sinh viên lọc việc theo khung giờ này. Chưa hỗ trợ ca qua nửa đêm.</small>
          </div>
          <div className="field"><label htmlFor="job-hours">Ngày làm và ghi chú lịch</label><input id="job-hours" name="workSchedule" value={values.workSchedule} onChange={update} maxLength={255} required placeholder="Thứ Hai – thứ Sáu, 4 buổi/tuần" /></div>
          {(error || serverError) && <p className="form-error" role="alert">{error || serverError}</p>}
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onCancel} disabled={saving}>Hủy</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Đang lưu...' : initial.id ? 'Lưu thay đổi' : 'Đăng tin'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function JobMarketplace({ session, intent, flash, onRequestAuth, onLogout, onProfileSaved }) {
  const signedIn = Boolean(session)
  const employer = session?.role === 'EMPLOYER'
  const student = session?.role === 'STUDENT'
  const [view, setView] = useState('home')
  const [allJobs, setAllJobs] = useState([])
  const [mine, setMine] = useState([])
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('all')
  const [location, setLocation] = useState('all')
  const [minSalary, setMinSalary] = useState('')
  const [window_, setWindow] = useState({ from: '', to: '' })
  const [includeFlexible, setIncludeFlexible] = useState(true)
  const [selected, setSelected] = useState(null)
  const [applying, setApplying] = useState(() => (intent?.type === 'apply' && student ? intent.job : null))
  const [editing, setEditing] = useState(() => (intent?.type === 'post' && employer ? { ...EMPTY_JOB } : null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(flash || '')
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
        if (!controller.signal.aborted) setError(err instanceof TypeError ? 'Không kết nối được Spring Boot ở cổng 8080.' : err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadJobs()
    return () => controller.abort()
  }, [employer, refreshKey, session?.accessToken])

  const list = view === 'mine' && employer ? mine : allJobs
  const industries = useMemo(() => {
    const counts = new Map()
    allJobs.forEach((job) => counts.set(job.industry, (counts.get(job.industry) || 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
  }, [allJobs])
  const locations = useMemo(() => [...new Set(list.map((j) => areaOf(j.location)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [list])

  // FR-06: từ khóa, ngành nghề, khu vực, mức lương tối thiểu + Sprint 4: khung giờ rảnh.
  const salaryFloor = Number(minSalary)
  const windowValid = !window_.from || !window_.to || toMinutes(window_.to) > toMinutes(window_.from)
  const visible = useMemo(() => list.filter((job) => {
    const haystack = `${job.title} ${job.description} ${job.industry} ${job.location}`.toLocaleLowerCase('vi-VN')
    return haystack.includes(query.toLocaleLowerCase('vi-VN').trim())
      && (industry === 'all' || job.industry === industry)
      && (location === 'all' || areaOf(job.location) === location)
      && (!(salaryFloor > 0) || Number(job.salaryMax) >= salaryFloor)
      && (!windowValid || fitsWindow(job, window_.from, window_.to, includeFlexible))
  }), [list, query, industry, location, salaryFloor, window_, includeFlexible, windowValid])
  const filtersActive = Boolean(query.trim()) || industry !== 'all' || location !== 'all' || salaryFloor > 0 || Boolean(window_.from)
  const inWindowCount = allJobs.filter((job) => hasWorkTime(job) && fitsWindow(job, window_.from, window_.to, false)).length
  const shiftCounts = SHIFTS.map((shift) => ({ ...shift, count: allJobs.filter((job) => hasWorkTime(job) && fitsWindow(job, shift.from, shift.to, false)).length }))
  const flexibleCount = allJobs.filter((job) => !hasWorkTime(job)).length
  const employerCount = new Set(allJobs.map((job) => job.employerId)).size
  const areaCounts = useMemo(() => {
    const counts = new Map()
    allJobs.forEach((job) => { const a = areaOf(job.location); if (a) counts.set(a, (counts.get(a) || 0) + 1) })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [allJobs])
  const topPaid = useMemo(() => [...allJobs].sort((a, b) => Number(b.salaryMax) - Number(a.salaryMax)).slice(0, 3), [allJobs])
  // Bảng "ca làm trong ngày": các ca có giờ cố định, sắp theo giờ bắt đầu
  const dayBoard = useMemo(() => allJobs.filter(hasWorkTime).sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)).slice(0, 4), [allJobs])

  function clearFilters() {
    setQuery('')
    setIndustry('all')
    setLocation('all')
    setMinSalary('')
    setWindow({ from: '', to: '' })
    setIncludeFlexible(true)
  }

  function go(next) {
    setView(next)
    setSelected(null)
    setError('')
    setNotice('')
    if (next !== 'home') clearFilters()
    window.scrollTo({ top: 0 })
  }

  function refresh() {
    setLoading(true)
    setError('')
    setRefreshKey((current) => current + 1)
  }

  function pickShift(from, to, flexibleOnly = false) {
    if (view !== 'home') setView('home')
    setWindow(flexibleOnly ? { from: '', to: '' } : { from, to })
    setIncludeFlexible(true)
    if (flexibleOnly) setQuery('')
    setTimeout(() => scrollToId('jobs'), 0)
  }

  function pickIndustry(name) {
    setIndustry(name)
    setTimeout(() => scrollToId('jobs'), 0)
  }

  function apply(job) {
    if (!signedIn) {
      onRequestAuth({ mode: 'login', reason: `Đăng nhập bằng tài khoản sinh viên để ứng tuyển “${job.title}”.`, intent: { type: 'apply', job, role: 'STUDENT' } })
      return
    }
    if (student) setApplying(job)
    else setSelected(job)
  }

  function postJob() {
    if (employer) {
      setEditing({ ...EMPTY_JOB })
      setError('')
      return
    }
    onRequestAuth({ mode: signedIn ? 'login' : 'register', role: 'EMPLOYER', reason: 'Đăng tin cần tài khoản nhà tuyển dụng.', intent: { type: 'post', role: 'EMPLOYER' } })
  }

  function startEdit(job) {
    setEditing({ ...job, salaryMin: String(job.salaryMin), salaryMax: String(job.salaryMax), startTime: hhmm(job.startTime), endTime: hhmm(job.endTime) })
    setError('')
  }

  async function saveJob(payload) {
    setSaving(true)
    setError('')
    try {
      const update = Boolean(editing.id)
      await callApi(update ? `/api/jobs/${editing.id}` : '/api/jobs', { method: update ? 'PUT' : 'POST', token: session.accessToken, body: payload })
      setEditing(null)
      setSelected(null)
      setView('mine')
      clearFilters()
      setNotice(update ? 'Đã lưu thay đổi tin tuyển dụng.' : 'Đã đăng tin. Tin đang ở trạng thái Đang tuyển.')
      refresh()
    } catch (err) {
      setError(err instanceof TypeError ? 'Không kết nối được Spring Boot.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  async function fillJob(job) {
    if (!window.confirm(`Đánh dấu “${job.title}” là đã đủ người? Sau bước này tin không nhận thêm đơn.`)) return
    setSaving(true)
    setError('')
    try {
      await callApi(`/api/jobs/${job.id}/fill`, { method: 'PATCH', token: session.accessToken })
      setNotice('Đã đánh dấu tin là Đã đủ người.')
      refresh()
    } catch (err) {
      setError(err instanceof TypeError ? 'Không kết nối được Spring Boot.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  // FR-09: FILLED → COMPLETED (cần ít nhất 1 ứng viên đã được chấp nhận)
  async function completeJob(job) {
    if (!window.confirm(`Xác nhận công việc “${job.title}” đã hoàn thành? Sau bước này tin không chỉnh sửa được.`)) return
    setSaving(true)
    setError('')
    try {
      await callApi(`/api/jobs/${job.id}/complete`, { method: 'PATCH', token: session.accessToken })
      setNotice('Đã đánh dấu công việc Hoàn thành.')
      refresh()
    } catch (err) {
      if (err instanceof TypeError) setError('Không kết nối được Spring Boot.')
      else if (err.message === friendlyError(409)) setError('Chỉ hoàn thành được tin Đã đủ người và có ít nhất một ứng viên được chấp nhận.')
      else setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const applyLabel = employer ? 'Xem chi tiết' : 'Ứng tuyển'
  const navItems = signedIn
    ? [
        { key: 'home', label: 'Việc làm' },
        ...(employer ? [{ key: 'mine', label: 'Tin của tôi' }, { key: 'candidates', label: 'Ứng viên' }] : [{ key: 'applications', label: 'Đơn đã ứng tuyển' }]),
        ...(employer || student ? [{ key: 'profile', label: 'Hồ sơ' }] : []),
      ]
    : []

  const jobList = (
    <>
      {error && <p className="form-error page-message" role="alert">{error}</p>}
      {notice && <p className="form-notice page-message" role="status">{notice}</p>}
      <div className="result-header">
        <strong>{loading ? 'Đang tải việc làm...' : `${visible.length} việc phù hợp`}</strong>
        <div className="result-tools">
          {filtersActive && <button type="button" className="text-button" onClick={clearFilters}>Xóa bộ lọc</button>}
          <button type="button" className="text-button" onClick={refresh} disabled={loading}>Tải lại</button>
        </div>
      </div>
      {loading ? (
        <div className="jobs-empty"><h3>Đang tải việc làm...</h3><p>Đang lấy dữ liệu từ máy chủ.</p></div>
      ) : visible.length === 0 ? (
        <div className="jobs-empty">
          <div className="empty-icon"><Icon name="search" size={28} /></div>
          <h3>{filtersActive ? 'Chưa có việc khớp bộ lọc' : view === 'mine' ? 'Bạn chưa đăng tin nào' : 'Chưa có việc đang tuyển'}</h3>
          <p>{filtersActive ? (window_.from ? 'Thử nới rộng khung giờ hoặc bật “Gồm việc giờ linh hoạt”.' : 'Thử từ khóa hoặc bộ lọc khác.') : view === 'mine' ? 'Tạo tin đầu tiên để nhận ứng viên.' : 'Quay lại sau, nhà tuyển dụng đăng tin mới mỗi ngày.'}</p>
          {filtersActive && <button type="button" className="outline-button" onClick={clearFilters}>Xóa bộ lọc</button>}
          {!filtersActive && view === 'mine' && <button type="button" className="primary-button" onClick={postJob}>Đăng tin tuyển dụng</button>}
        </div>
      ) : (
        <div className="job-list">
          {visible.map((job) => (
            <JobCard key={job.id} job={job} onOpen={setSelected} onApply={apply} applyLabel={applyLabel}
              showActions={view === 'mine' && employer} onEdit={startEdit} onFill={fillJob} onComplete={completeJob} busy={saving} />
          ))}
        </div>
      )}
    </>
  )

  const filterBar = (
    <div className="filter-bar" role="group" aria-label="Bộ lọc việc làm">
      <label className="filter-field"><span>Ngành nghề</span><select value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="all">Tất cả</option>{industries.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label className="filter-field"><span>Khu vực</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="all">Tất cả</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="filter-field"><span>Lương tối thiểu (VNĐ)</span><input type="number" min="0" step="1000" inputMode="numeric" placeholder="25000" value={minSalary} onChange={(event) => setMinSalary(event.target.value)} /></label>
      <div className="filter-field wide">
        <span id="filter-time-label">Khung giờ rảnh</span>
        <TimeRangeField id="filter-time" value={window_} onChange={setWindow} compact />
      </div>
      <label className="check-inline"><input type="checkbox" checked={includeFlexible} onChange={(event) => setIncludeFlexible(event.target.checked)} disabled={!window_.from} />Gồm việc giờ linh hoạt</label>
    </div>
  )

  return (
    <div className="site">
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => go('home')} aria-label="Về trang chủ">
            <span className="brand-mark">SF</span>
            <span className="brand-name">Student Freelance<small>Việc làm thêm cho sinh viên</small></span>
          </button>
          <nav className="topnav" aria-label="Điều hướng chính">
            {signedIn
              ? navItems.map((item) => <button key={item.key} type="button" className={view === item.key ? 'active' : ''} aria-current={view === item.key ? 'page' : undefined} onClick={() => go(item.key)}>{item.label}</button>)
              : <>
                  <button type="button" onClick={() => scrollToId('jobs')}>Việc làm</button>
                  <button type="button" onClick={() => scrollToId('shifts')}>Theo khung giờ</button>
                  <button type="button" onClick={() => scrollToId('industries')}>Ngành nghề</button>
                  <button type="button" onClick={() => scrollToId('employers')}>Nhà tuyển dụng</button>
                </>}
          </nav>
          <div className="topbar-actions">
            {signedIn ? (
              <>
                {employer && <button type="button" className="cta-button small" onClick={postJob}><Icon name="plus" size={16} />Đăng tin</button>}
                <NotificationBell token={session.accessToken} onOpenItem={() => go(employer ? 'candidates' : 'applications')} />
                <button type="button" className="account-chip" onClick={() => (employer || student) && go('profile')} title={session.email}>
                  <span className="avatar">{session.fullName?.slice(0, 1).toUpperCase() || '?'}</span>
                  <span className="account-text">{session.fullName}<small>{employer ? 'Nhà tuyển dụng' : student ? 'Sinh viên' : 'Quản trị viên'}</small></span>
                </button>
                <button type="button" className="ghost-button" onClick={onLogout}>Đăng xuất</button>
              </>
            ) : (
              <>
                <button type="button" className="ghost-button" onClick={() => onRequestAuth({ mode: 'login' })}>Đăng nhập</button>
                <button type="button" className="cta-button small" onClick={() => onRequestAuth({ mode: 'register' })}>Đăng ký</button>
              </>
            )}
          </div>
        </div>
      </header>

      {view === 'home' ? (
        <main>
          <section className="hero">
            <div className="hero-inner">
              <div className="hero-top">
              <div className="hero-copy">
              <h1>{employer ? 'Tuyển sinh viên đúng ca bạn cần.' : 'Việc làm thêm vừa với giờ rảnh của bạn.'}</h1>
              <p className="hero-lead">{employer ? 'Đăng tin kèm khung giờ làm việc để sinh viên rảnh đúng ca tìm thấy bạn.' : 'Chọn khung giờ bạn rảnh, chúng tôi chỉ hiện những ca làm nằm gọn trong đó.'}</p>
              <dl className="hero-stats">
                <div><dt>Việc đang tuyển</dt><dd>{allJobs.length}</dd></div>
                <div><dt>Nhà tuyển dụng</dt><dd>{employerCount}</dd></div>
                <div><dt>Khu vực</dt><dd>{areaCounts.length}</dd></div>
              </dl>
              </div>

              <aside className="day-board" aria-label="Các ca làm trong ngày">
                <h2>Ca làm trong ngày</h2>
                <ol>
                  {dayBoard.map((job) => (
                    <li key={job.id}>
                      <button type="button" onClick={() => setSelected(job)}>
                        <span className={`board-time period-bg-${periodOf(job)}`}>{hhmm(job.startTime)}<small>{hhmm(job.endTime)}</small></span>
                        <span className="board-text"><strong>{job.title}</strong><small>{areaOf(job.location)}</small><em>{salaryLabel(job)}</em></span>
                      </button>
                    </li>
                  ))}
                  {dayBoard.length === 0 && <li className="board-empty">Chưa có ca làm có giờ cố định.</li>}
                </ol>
                <button type="button" className="board-more" onClick={() => scrollToId('shifts')}>Xem theo ca sáng, chiều, tối</button>
              </aside>
              </div>

              <form className="search-panel" onSubmit={(event) => { event.preventDefault(); scrollToId('jobs') }}>
                <label className="search-cell grow">
                  <Icon name="search" />
                  <input type="search" aria-label="Từ khóa" placeholder="Tên việc, ngành nghề..." value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
                <label className="search-cell">
                  <Icon name="pin" />
                  <select aria-label="Khu vực" value={location} onChange={(event) => setLocation(event.target.value)}>
                    <option value="all">Mọi khu vực</option>
                    {locations.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <div className="search-cell time-cell">
                  <Icon name="clock" />
                  <span className="sr-only" id="hero-time-label">Khung giờ rảnh</span>
                  <TimeRangeField id="hero-time" value={window_} onChange={setWindow} />
                </div>
                <button type="submit" className="cta-button">Tìm việc</button>
              </form>

              <div className="hero-day">
                <DayBar from={window_.from} to={window_.to} period={window_.from ? periodOf({ startTime: window_.from, endTime: window_.to }) : 'flex'} size="large" />
                <p className="hero-day-caption" aria-live="polite">
                  {!windowValid
                    ? 'Giờ kết thúc phải sau giờ bắt đầu.'
                    : window_.from
                      ? <><strong>{inWindowCount}</strong> ca làm nằm trong {window_.from} – {window_.to}</>
                      : <><strong>{allJobs.length}</strong> việc đang tuyển. Chọn giờ rảnh để xem ca phù hợp.</>}
                </p>
              </div>
            </div>
          </section>

          <section className="band" id="shifts" aria-labelledby="shifts-title">
            <div className="container">
              <h2 id="shifts-title" className="section-title">Tìm theo ca làm</h2>
              <div className="shift-grid">
                {shiftCounts.map((shift) => (
                  <button key={shift.key} type="button" className={`shift-tile period-${shift.key} ${window_.from === shift.from && window_.to === shift.to ? 'selected' : ''}`} onClick={() => pickShift(shift.from, shift.to)}>
                    <Icon name={shift.key === 'morning' ? 'sun' : shift.key === 'afternoon' ? 'sunset' : 'moon'} size={26} />
                    <strong>{shift.label}</strong>
                    <span>{shift.from} – {shift.to}</span>
                    <em>{shift.count} việc</em>
                  </button>
                ))}
                <button type="button" className="shift-tile period-flex" onClick={() => pickShift('', '', true)}>
                  <Icon name="shuffle" size={26} />
                  <strong>Giờ linh hoạt</strong>
                  <span>Tự sắp xếp thời gian</span>
                  <em>{flexibleCount} việc</em>
                </button>
              </div>
            </div>
          </section>

          <section className="band tint" id="industries" aria-labelledby="industries-title">
            <div className="container">
              <h2 id="industries-title" className="section-title">Ngành nghề đang tuyển</h2>
              <div className="industry-grid">
                {industries.map(([name, count]) => (
                  <button key={name} type="button" className={`industry-tile ${industry === name ? 'selected' : ''}`} onClick={() => pickIndustry(industry === name ? 'all' : name)} aria-pressed={industry === name}>
                    <IndustryBadge industry={name} size="lg" />
                    <strong>{name}</strong>
                    <span>{count} việc</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="steps-band" aria-labelledby="steps-title">
            <div className="container">
              <h2 id="steps-title" className="section-title">Bắt đầu trong 3 bước</h2>
              <ol className="steps">
                <li className="step-morning"><span className="step-num">1</span><Icon name="clock" size={28} /><strong>Chọn giờ rảnh</strong><p>Đặt khung giờ bạn đi làm được, ví dụ 17:00 – 19:00 sau giờ học.</p></li>
                <li className="step-afternoon"><span className="step-num">2</span><Icon name="briefcase" size={28} /><strong>Ứng tuyển bằng hồ sơ</strong><p>Liên kết CV trong hồ sơ được điền sẵn, chỉ cần viết vài dòng giới thiệu.</p></li>
                <li className="step-evening"><span className="step-num">3</span><Icon name="check" size={28} /><strong>Nhận kết quả</strong><p>Theo dõi đơn ở mục Đơn đã ứng tuyển: Chờ xét duyệt, Đã chấp nhận hoặc Đã từ chối.</p></li>
              </ol>
            </div>
          </section>

          <section className="band" id="jobs" aria-labelledby="jobs-title">
            <div className="container">
              <div className="section-head">
                <h2 id="jobs-title" className="section-title">Việc làm mới nhất</h2>
                <p>{allJobs.length} việc đang tuyển từ {employerCount} nhà tuyển dụng</p>
              </div>
              {filterBar}
              <div className="jobs-layout">
                <div className="jobs-main">{jobList}</div>
                <aside className="jobs-aside">
                  <section className="aside-card">
                    <h3>Thù lao cao nhất</h3>
                    <ul className="top-paid">
                      {topPaid.map((job) => (
                        <li key={job.id}><button type="button" onClick={() => setSelected(job)}><IndustryBadge industry={job.industry} size="sm" /><span><strong>{job.title}</strong><small>{salaryLabel(job)}</small></span></button></li>
                      ))}
                    </ul>
                  </section>
                  <section className="aside-card">
                    <h3>Việc theo khu vực</h3>
                    <ul className="area-bars">
                      {areaCounts.map(([name, count]) => (
                        <li key={name}><button type="button" onClick={() => setLocation(location === name ? 'all' : name)} aria-pressed={location === name} className={location === name ? 'active' : ''}>
                          <span className="area-row"><span>{name}</span><strong>{count}</strong></span>
                          <span className="area-track"><span style={{ width: `${(count / Math.max(1, allJobs.length)) * 100}%` }} /></span>
                        </button></li>
                      ))}
                    </ul>
                  </section>
                  <section className="aside-card tips">
                    <h3>Mẹo ứng tuyển</h3>
                    <ul>
                      <li>Cập nhật trường, chuyên ngành và liên kết CV trong Hồ sơ trước khi ứng tuyển.</li>
                      <li>Ghi rõ ngày bạn đi làm được trong lời giới thiệu.</li>
                      <li>Mỗi tin chỉ ứng tuyển được một lần, hãy đọc kỹ mô tả.</li>
                    </ul>
                  </section>
                  {!employer && (
                    <section className="aside-card promo">
                      <h3>Bạn đang tuyển người?</h3>
                      <p>Đăng tin kèm khung giờ để sinh viên rảnh đúng ca tìm thấy bạn.</p>
                      <button type="button" className="cta-button small" onClick={postJob}>Đăng tin</button>
                    </section>
                  )}
                </aside>
              </div>
            </div>
          </section>

          {!employer && (
            <section className="employer-band" id="employers">
              <div className="container employer-inner">
                <div>
                  <h2>Cần người làm theo ca?</h2>
                  <p>Đăng tin miễn phí, ghi rõ khung giờ và nhận đơn từ sinh viên rảnh đúng ca đó.</p>
                </div>
                <button type="button" className="light-button" onClick={postJob}>Đăng tin tuyển dụng</button>
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="container page">
          {view === 'profile' ? (
            <ProfilePage session={session} onProfileSaved={onProfileSaved} />
          ) : view === 'applications' || view === 'candidates' ? (
            <ApplicationCenter session={session} employer={employer} jobs={mine} notice={notice} />
          ) : (
            <>
              <div className="section-title-row">
                <div>
                  <h2>Tin tuyển dụng của tôi</h2>
                  <p>Chỉnh sửa tin đang tuyển, đánh dấu đủ người và xác nhận hoàn thành.</p>
                </div>
                <button type="button" className="primary-button" onClick={postJob}><Icon name="plus" size={16} />Đăng tin mới</button>
              </div>
              {jobList}
            </>
          )}
        </main>
      )}

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <span className="brand-mark">SF</span>
            <p>Student Freelance Marketplace kết nối sinh viên với việc làm bán thời gian theo ca.</p>
          </div>
          <div>
            <h3>Sinh viên</h3>
            <button type="button" onClick={() => { go('home'); setTimeout(() => scrollToId('jobs'), 0) }}>Tìm việc làm</button>
            <button type="button" onClick={() => pickShift('17:00', '23:00')}>Việc ca tối</button>
            <button type="button" onClick={() => pickShift('06:00', '12:00')}>Việc ca sáng</button>
          </div>
          <div>
            <h3>Nhà tuyển dụng</h3>
            <button type="button" onClick={postJob}>Đăng tin tuyển dụng</button>
            {employer && <button type="button" onClick={() => go('candidates')}>Xem ứng viên</button>}
          </div>
          <div>
            <h3>Khu vực</h3>
            {locations.slice(0, 4).map((item) => <button key={item} type="button" onClick={() => { go('home'); setLocation(item); setTimeout(() => scrollToId('jobs'), 0) }}>{item}</button>)}
          </div>
        </div>
        <p className="footer-note">Đồ án Chuyên đề tốt nghiệp 2, Trường Đại học Văn Lang. Xây dựng bằng ReactJS, Spring Boot và MySQL.</p>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="job-detail-title" className="job-modal job-detail">
            <div className="modal-heading">
              <div className="detail-head">
                <IndustryBadge industry={selected.industry} size="lg" />
                <div>
                  <h2 id="job-detail-title">{selected.title}</h2>
                  <span className={`status-pill ${statusOf(selected).className}`}>{statusOf(selected).label}</span>
                </div>
              </div>
              <button type="button" className="close-button" aria-label="Đóng" onClick={() => setSelected(null)}><Icon name="close" size={18} /></button>
            </div>
            <div className="job-detail-info">
              <div><small>Ngành nghề</small><strong>{selected.industry}</strong></div>
              <div><small>Địa điểm</small><strong>{selected.location}</strong></div>
              <div><small>Thù lao</small><strong className="money">{salaryLabel(selected)}</strong></div>
              <div><small>Khung giờ</small><strong>{workTimeLabel(selected)}</strong><DayBar from={selected.startTime} to={selected.endTime} period={periodOf(selected)} /></div>
              <div className="span-2"><small>Ngày làm và ghi chú lịch</small><strong>{selected.workSchedule}</strong></div>
              <div className="span-2"><small>Đánh giá nhà tuyển dụng</small><RatingBadge userId={selected.employerId} empty="Nhà tuyển dụng chưa có đánh giá" /></div>
            </div>
            <h3>Mô tả công việc</h3>
            <p className="detail-description">{selected.description}</p>
            <div className="modal-actions">
              <button type="button" className="outline-button" onClick={() => setSelected(null)}>Đóng</button>
              {!employer && selected.jobStatus === 'OPEN' && <button type="button" className="primary-button" onClick={() => { const job = selected; setSelected(null); apply(job) }}>Ứng tuyển</button>}
            </div>
          </section>
        </div>
      )}
      {applying && <ApplyJobModal job={applying} token={session.accessToken} onCancel={() => setApplying(null)} onSuccess={() => { setApplying(null); go('applications'); setNotice('Đã gửi đơn ứng tuyển. Theo dõi kết quả tại đây.') }} />}
      {editing && <JobForm key={editing.id || 'new'} initial={editing} saving={saving} serverError={error} onCancel={() => setEditing(null)} onSave={saveJob} />}
    </div>
  )
}

