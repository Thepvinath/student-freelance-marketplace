import { useEffect, useRef, useState } from 'react'
import { RatingBadge, ReviewModal } from './Reviews.jsx'
import { CvPicker, CvViewLink } from './CvFile.jsx'
import { externalCvLink, isUploadedCv } from './cvApi.js'

const STATUS_LABELS = {
  PENDING: 'Chờ xét duyệt',
  APPROVED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

const JOB_LABELS = { OPEN: 'Đang tuyển', FILLED: 'Đã đủ người', COMPLETED: 'Hoàn thành' }

const ERROR_LABELS = {
  400: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu hoặc không thuộc quyền quản lý của bạn.',
  409: 'Bạn đã ứng tuyển công việc này hoặc trạng thái không cho phép thay đổi.',
}

async function applicationApi(path, { method = 'GET', token, body, signal } = {}) {
  const response = await fetch(path, {
    method,
    signal,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    throw new Error(ERROR_LABELS[response.status] || `Yêu cầu thất bại (HTTP ${response.status}).`)
  }
  return response.status === 204 ? null : response.json()
}

function StatusTag({ value }) {
  return <span className={`application-tag status-${String(value).toLowerCase()}`}>{STATUS_LABELS[value] || value}</span>
}

function formatDate(value) {
  if (!value) return '—'
  return value.replace('T', ' ').slice(0, 16)
}

// Sprint 5: liên hệ sau khi đơn được chấp nhận – gọi điện, gửi email, nhắn Zalo
function telLink(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : null
}

// Zalo chỉ dùng số di động Việt Nam (10 số, bắt đầu 03/05/07/08/09)
function zaloLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return /^0[35789]\d{8}$/.test(digits) ? `https://zalo.me/${digits}` : null
}

function ContactCard({ title, name, phone, email, note }) {
  return (
    <section className="contact-card" aria-label={title}>
      <div className="contact-head">
        <strong>{title}</strong>
        <small>{note}</small>
      </div>
      <dl className="contact-list">
        {name && <div><dt>Tên</dt><dd>{name}</dd></div>}
        <div><dt>Điện thoại</dt><dd>{phone || <span className="muted">Chưa cập nhật trong hồ sơ</span>}</dd></div>
        <div><dt>Email</dt><dd>{email || <span className="muted">Không có</span>}</dd></div>
      </dl>
      <div className="contact-actions">
        {telLink(phone) && <a className="contact-button call" href={telLink(phone)}>Gọi điện</a>}
        {zaloLink(phone) && <a className="contact-button zalo" href={zaloLink(phone)} target="_blank" rel="noopener noreferrer">Nhắn Zalo</a>}
        {email && <a className="contact-button mail" href={`mailto:${email}`}>Gửi email</a>}
      </div>
    </section>
  )
}


export function ApplyJobModal({ job, token, onCancel, onSuccess }) {
  const [introduction, setIntroduction] = useState('')
  const [cvUrl, setCvUrl] = useState('')
  const [cvFromProfile, setCvFromProfile] = useState(false)
  const [cvName, setCvName] = useState('')
  const cvTouched = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // FR-04: đính kèm sẵn CV (file PDF hoặc liên kết cũ) từ hồ sơ sinh viên, sinh viên vẫn đổi được.
  useEffect(() => {
    const controller = new AbortController()
    applicationApi('/api/profile/me', { token, signal: controller.signal })
      .then((profile) => {
        // Không ghi đè nếu sinh viên đã tự nhập CV.
        if (controller.signal.aborted || !profile?.cvUrl || cvTouched.current) return
        setCvUrl(profile.cvUrl)
        setCvFromProfile(true)
      })
      .catch(() => {
        // Không có hồ sơ hoặc lỗi mạng: sinh viên tự nhập CV như trước.
      })
    return () => controller.abort()
  }, [token])

  async function submit(event) {
    event.preventDefault()
    setError('')
    const url = cvUrl.trim()
    if (url && !isUploadedCv(url) && !externalCvLink(url)) {
      setError('CV không hợp lệ. Hãy chọn lại file PDF.')
      return
    }
    setBusy(true)
    try {
      await applicationApi(`/api/jobs/${job.id}/applications`, {
        method: 'POST', token, body: { introduction: introduction.trim(), cvUrl: url },
      })
      onSuccess()
    } catch (caught) {
      setError(caught instanceof TypeError ? 'Không thể kết nối Spring Boot.' : caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel()
    }}>
      <section className="job-modal application-modal" role="dialog" aria-modal="true" aria-labelledby="apply-title">
        <div className="modal-heading">
          <div>
            <p className="section-kicker">HỒ SƠ ỨNG TUYỂN</p>
            <h2 id="apply-title">Ứng tuyển: {job.title}</h2>
          </div>
          <button type="button" className="close-button" aria-label="Đóng" onClick={onCancel} disabled={busy}>×</button>
        </div>
        <p className="application-help">Giới thiệu ngắn gọn về bản thân và lý do bạn phù hợp với công việc. Mỗi sinh viên chỉ ứng tuyển một lần cho mỗi tin.</p>
        <form className="job-edit-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="apply-introduction">Lời giới thiệu (không bắt buộc)</label>
            <textarea id="apply-introduction" rows={5} maxLength={2000} value={introduction} onChange={(event) => setIntroduction(event.target.value)} placeholder="Xin chào, em quan tâm đến vị trí này vì..." />
          </div>
          <div className="field">
            <label htmlFor="apply-cv">CV đính kèm (không bắt buộc)</label>
            <CvPicker id="apply-cv" value={cvUrl} token={token} fileName={cvName}
              hint={cvFromProfile ? 'Lấy từ hồ sơ của bạn. Có thể chọn file khác cho đơn này.' : 'Nhà tuyển dụng của tin này sẽ xem được CV.'}
              onChange={(url, info) => { cvTouched.current = true; setCvUrl(url); setCvName(info?.fileName || ''); setCvFromProfile(false) }} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onCancel} disabled={busy}>Hủy</button>
            <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi đơn ứng tuyển →'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default function ApplicationCenter({ session, employer, jobs, notice }) {
  const [jobId, setJobId] = useState(jobs.length ? String(jobs[0].id) : '')
  const [fetchResult, setFetchResult] = useState({ key: '', applications: [], error: '' })
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [actingId, setActingId] = useState(null)
  const [reload, setReload] = useState(0)
  const [reviewing, setReviewing] = useState(null)

  // Derive a valid selection without synchronously setting state in an Effect.
  // Jobs may arrive after this component first renders.
  const selectedJobId = employer
    ? (jobs.some((job) => String(job.id) === jobId)
      ? jobId
      : String(jobs[0]?.id ?? ''))
    : ''

  // Keep each response associated with its request so stale data is not shown
  // while changing jobs, changing accounts, or refreshing applications.
  const requestKey = employer
    ? (selectedJobId ? `employer:${session.userId}:${selectedJobId}:${reload}` : '')
    : `student:${session.userId}:${reload}`
  const currentResult = fetchResult.key === requestKey ? fetchResult : null
  const applications = currentResult?.applications ?? []
  const loading = Boolean(requestKey) && !currentResult
  const error = actionError || currentResult?.error || ''

  useEffect(() => {
    // With no owned jobs, show the empty state without making a request.
    if (!requestKey) return undefined

    const controller = new AbortController()
    const endpoint = employer
      ? `/api/jobs/${selectedJobId}/applications`
      : '/api/applications/mine'

    applicationApi(endpoint, { token: session.accessToken, signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setFetchResult({ key: requestKey, applications: data, error: '' })
        }
      })
      .catch((caught) => {
        if (!controller.signal.aborted) {
          const nextError = caught instanceof TypeError
            ? 'Không thể kết nối Spring Boot.'
            : caught.message
          setFetchResult({ key: requestKey, applications: [], error: nextError })
        }
      })

    return () => controller.abort()
  }, [employer, selectedJobId, requestKey, session.accessToken])

  async function review(id, status) {
    if (!window.confirm(`Xác nhận ${status === 'APPROVED' ? 'chấp nhận' : 'từ chối'} đơn ứng tuyển?`)) return
    setActingId(id)
    setActionError('')
    setMessage('')
    try {
      await applicationApi(`/api/applications/${id}/status`, {
        method: 'PATCH', token: session.accessToken, body: { status },
      })
      setMessage(status === 'APPROVED' ? 'Đã chấp nhận đơn ứng tuyển.' : 'Đã từ chối đơn ứng tuyển.')
      setReload((n) => n + 1)
    } catch (caught) {
      setActionError(caught instanceof TypeError ? 'Không thể kết nối Spring Boot.' : caught.message)
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="application-center">
      <div className="section-title-row">
        <div>
          <p className="section-kicker">{employer ? 'QUẢN LÝ ỨNG VIÊN' : 'THEO DÕI HỒ SƠ'}</p>
          <h2>{employer ? 'Đơn ứng tuyển' : 'Ứng tuyển của tôi'}</h2>
          <p>{employer ? 'Xem và xử lý hồ sơ ứng viên cho từng tin tuyển dụng.' : 'Theo dõi tình trạng các công việc bạn đã ứng tuyển.'}</p>
        </div>
      </div>

      {employer && (
        <label className="application-job-picker">
          <span>Chọn tin tuyển dụng của bạn</span>
          <select value={selectedJobId} onChange={(event) => { setJobId(event.target.value); setMessage(''); setActionError('') }}>
            {jobs.length === 0 && <option value="">Chưa có tin tuyển dụng</option>}
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} ({JOB_LABELS[job.jobStatus] || job.jobStatus}{job.moderationStatus && job.moderationStatus !== 'APPROVED' ? `, ${job.moderationStatus === 'PENDING' ? 'chờ duyệt' : 'bị từ chối'}` : ''})</option>)}
          </select>
        </label>
      )}
      {notice && <p className="form-notice dashboard-message" role="status">{notice}</p>}
      {message && <p className="form-notice dashboard-message" role="status">{message}</p>}
      {error && <p className="form-error dashboard-message" role="alert">{error}</p>}
      {loading ? (
        <div className="jobs-empty"><h3>Đang tải đơn ứng tuyển...</h3></div>
      ) : applications.length === 0 ? (
        <div className="jobs-empty">
          <div className="empty-icon">✉</div>
          <h3>{employer ? 'Chưa có ứng viên' : 'Bạn chưa ứng tuyển công việc nào'}</h3>
          <p>{employer ? 'Khi sinh viên ứng tuyển, hồ sơ của họ sẽ xuất hiện ở đây.' : 'Hãy khám phá việc làm và gửi đơn ứng tuyển đầu tiên.'}</p>
        </div>
      ) : (
        <div className="application-list">
          {applications.map((app) => (
            <article className="application-item" key={app.id}>
              <div className="application-item-top">
                <div>
                  <p className="section-kicker">{employer ? 'ỨNG VIÊN' : 'CÔNG VIỆC ĐÃ ỨNG TUYỂN'}</p>
                  <h3>{employer ? app.studentName : app.jobTitle}</h3>
                  <p>{employer ? app.studentEmail : `Mã tin #${app.jobId}`}</p>
                  {employer && <RatingBadge userId={app.studentId} empty="Sinh viên chưa có đánh giá" />}
                </div>
                <StatusTag value={app.status} />
              </div>
              {employer && <p className="application-job-title">Vị trí: <strong>{app.jobTitle}</strong></p>}
              {app.introduction && <p className="application-introduction">{app.introduction}</p>}
              <div className="application-meta">
                <span>Ngày ứng tuyển: {formatDate(app.appliedAt)}</span>
                {app.cvUrl && <CvViewLink url={app.cvUrl} token={session.accessToken} />}
              </div>
              {app.status === 'APPROVED' && (employer
                ? <ContactCard title="Liên hệ sinh viên" note="Trao đổi lịch làm, địa điểm và giấy tờ cần mang theo." phone={app.studentPhone} email={app.studentEmail} />
                : <ContactCard title="Liên hệ nhà tuyển dụng" note="Bạn đã được nhận. Liên hệ để hỏi lịch làm và ngày bắt đầu." name={app.employerName} phone={app.employerPhone} email={app.employerEmail} />)}
              {app.jobStatus === 'COMPLETED' && app.status === 'APPROVED' && (
                <div className="application-actions review-actions">
                  <span className="job-done-tag">Công việc đã hoàn thành</span>
                  {app.reviewedByMe
                    ? <span className="application-tag status-approved">Đã đánh giá</span>
                    : <button type="button" className="cta-button small" onClick={() => setReviewing(app)}>{employer ? 'Đánh giá sinh viên' : 'Đánh giá nhà tuyển dụng'}</button>}
                </div>
              )}
              {employer && app.status === 'PENDING' && (
                <div className="application-actions">
                  <button type="button" className="primary-button" disabled={actingId !== null} onClick={() => review(app.id, 'APPROVED')}>Chấp nhận</button>
                  <button type="button" className="outline-button" disabled={actingId !== null} onClick={() => review(app.id, 'REJECTED')}>Từ chối</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {reviewing && (
        <ReviewModal
          application={reviewing}
          token={session.accessToken}
          targetLabel={employer ? `sinh viên ${reviewing.studentName}` : 'nhà tuyển dụng'}
          onCancel={() => setReviewing(null)}
          onDone={() => { setReviewing(null); setMessage('Đã gửi đánh giá. Cảm ơn bạn!'); setReload((n) => n + 1) }}
        />
      )}
    </div>
  )
}
