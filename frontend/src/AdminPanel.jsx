import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { TypeBadge } from './JobBadges.jsx'
import { salaryLabel, workTimeLabel } from './jobUtils.js'

// FR-12: Quản trị viên duyệt tin tuyển dụng trước khi sinh viên nhìn thấy.
const TABS = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Bị từ chối' },
  { key: 'ALL', label: 'Tất cả' },
]

const MODERATION_LABELS = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối' }

// Lý do hay gặp, bấm để điền nhanh
const QUICK_REASONS = [
  'Mô tả công việc chưa rõ nhiệm vụ và yêu cầu.',
  'Mức thù lao không hợp lý hoặc thấp hơn lương tối thiểu.',
  'Địa chỉ hoặc thông tin nhà tuyển dụng chưa đầy đủ.',
  'Có dấu hiệu thu phí hoặc đặt cọc từ người lao động.',
]

const ERRORS = {
  400: 'Hãy nhập lý do từ chối (tối đa 500 ký tự).',
  401: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại.',
  403: 'Chỉ tài khoản Quản trị viên được duyệt tin.',
  404: 'Không tìm thấy tin tuyển dụng.',
  409: 'Tin này đã được xử lý trước đó. Danh sách đã được tải lại.',
}

async function adminApi(path, token, { method = 'GET', body, signal } = {}) {
  const response = await fetch(path, {
    method,
    signal,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const error = new Error(ERRORS[response.status] || `Yêu cầu thất bại (HTTP ${response.status}).`)
    error.status = response.status
    throw error
  }
  return response.json()
}

function formatDate(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

function RejectForm({ busy, onCancel, onSubmit }) {
  const [reason, setReason] = useState('')
  return (
    <form className="reject-form" onSubmit={(event) => { event.preventDefault(); if (reason.trim()) onSubmit(reason.trim()) }}>
      <label htmlFor="reject-reason">Lý do từ chối (nhà tuyển dụng sẽ nhận được)</label>
      <div className="quick-reasons">
        {QUICK_REASONS.map((item) => <button key={item} type="button" onClick={() => setReason(item)}>{item}</button>)}
      </div>
      <textarea id="reject-reason" rows={3} maxLength={500} required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Mô tả công việc chưa rõ ràng, hãy bổ sung nhiệm vụ cụ thể." />
      <div className="reject-actions">
        <button type="button" className="outline-button" onClick={onCancel} disabled={busy}>Hủy</button>
        <button type="submit" className="danger-button" disabled={busy || !reason.trim()}>{busy ? 'Đang gửi...' : 'Từ chối tin'}</button>
      </div>
    </form>
  )
}

export default function AdminPanel({ session }) {
  const [tab, setTab] = useState('PENDING')
  const [reload, setReload] = useState(0)
  const [data, setData] = useState({ key: '', items: [], counts: null, error: '' })
  const [rejecting, setRejecting] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const requestKey = `${tab}:${reload}`
  const current = data.key === requestKey ? data : null

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      adminApi(`/api/admin/jobs?status=${tab}`, session.accessToken, { signal: controller.signal }),
      adminApi('/api/admin/jobs/counts', session.accessToken, { signal: controller.signal }),
    ])
      .then(([items, counts]) => { if (!controller.signal.aborted) setData({ key: requestKey, items, counts, error: '' }) })
      .catch((error) => {
        if (!controller.signal.aborted) setData((old) => ({ key: requestKey, items: [], counts: old.counts, error: error instanceof TypeError ? 'Không kết nối được Spring Boot.' : error.message }))
      })
    return () => controller.abort()
  }, [tab, requestKey, session.accessToken])

  const counts = current?.counts || data.counts

  async function act(item, action, reason) {
    setBusyId(item.job.id)
    setActionError('')
    setMessage('')
    try {
      await adminApi(`/api/admin/jobs/${item.job.id}/${action}`, session.accessToken, { method: 'PATCH', body: action === 'reject' ? { reason } : undefined })
      setMessage(action === 'approve' ? `Đã duyệt “${item.job.title}”. Tin đang hiển thị cho sinh viên.` : `Đã từ chối “${item.job.title}” và gửi lý do cho nhà tuyển dụng.`)
      setRejecting(null)
    } catch (error) {
      setActionError(error instanceof TypeError ? 'Không kết nối được Spring Boot.' : error.message)
    } finally {
      setBusyId(null)
      setReload((n) => n + 1)
    }
  }

  return (
    <div className="admin-panel">
      <div className="section-title-row">
        <div>
          <h2>Duyệt tin tuyển dụng</h2>
          <p>Tin mới và tin vừa chỉnh sửa chỉ hiển thị cho sinh viên sau khi được duyệt.</p>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Lọc theo trạng thái duyệt">
        {TABS.map((item) => (
          <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} className={`admin-tab tab-${item.key.toLowerCase()} ${tab === item.key ? 'active' : ''}`}
            onClick={() => { setTab(item.key); setRejecting(null); setMessage(''); setActionError('') }}>
            {item.label}
            {counts && item.key !== 'ALL' && <span className="tab-count">{counts[item.key] ?? 0}</span>}
          </button>
        ))}
      </div>

      {message && <p className="form-notice dashboard-message" role="status">{message}</p>}
      {(actionError || current?.error) && <p className="form-error dashboard-message" role="alert">{actionError || current.error}</p>}

      {!current ? (
        <div className="jobs-empty"><h3>Đang tải tin tuyển dụng...</h3></div>
      ) : current.items.length === 0 ? (
        <div className="jobs-empty">
          <div className="empty-icon"><Icon name="check" size={28} /></div>
          <h3>{tab === 'PENDING' ? 'Không còn tin chờ duyệt' : 'Chưa có tin nào ở mục này'}</h3>
          <p>{tab === 'PENDING' ? 'Khi nhà tuyển dụng đăng hoặc sửa tin, tin sẽ xuất hiện ở đây và chuông thông báo sẽ báo cho bạn.' : 'Chọn mục khác để xem.'}</p>
        </div>
      ) : (
        <div className="admin-list">
          {current.items.map((item) => {
            const job = item.job
            return (
              <article key={job.id} className={`admin-item mod-${job.moderationStatus.toLowerCase()}`}>
                <div className="admin-item-top">
                  <div>
                    <div className="admin-title-row">
                      <h3>{job.title}</h3>
                      <TypeBadge job={job} />
                      <span className={`mod-pill mod-${job.moderationStatus.toLowerCase()}`}>{MODERATION_LABELS[job.moderationStatus]}</span>
                    </div>
                    <p className="admin-employer">
                      <strong>{item.organizationName || item.employerName || `Nhà tuyển dụng #${job.employerId}`}</strong>
                      {item.employerEmail && <span>{item.employerEmail}</span>}
                      <span>Gửi lúc {formatDate(job.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <dl className="admin-facts">
                  <div><dt>Ngành nghề</dt><dd>{job.industry}</dd></div>
                  <div><dt>Địa điểm</dt><dd>{job.location}</dd></div>
                  <div><dt>Thù lao</dt><dd>{salaryLabel(job)}</dd></div>
                  <div><dt>Khung giờ</dt><dd>{workTimeLabel(job)}</dd></div>
                  <div className="wide"><dt>Ngày làm</dt><dd>{job.workSchedule}</dd></div>
                </dl>
                <p className="admin-description">{job.description}</p>
                {job.moderationStatus === 'REJECTED' && job.moderationNote && <p className="mod-note rejected"><strong>Lý do từ chối:</strong> {job.moderationNote}</p>}
                {job.moderationStatus !== 'PENDING' && job.reviewedAt && <p className="admin-reviewed">Xử lý lúc {formatDate(job.reviewedAt)}</p>}
                {job.moderationStatus === 'PENDING' && (rejecting === job.id ? (
                  <RejectForm busy={busyId === job.id} onCancel={() => setRejecting(null)} onSubmit={(reason) => act(item, 'reject', reason)} />
                ) : (
                  <div className="admin-actions">
                    <button type="button" className="approve-button" disabled={busyId !== null} onClick={() => act(item, 'approve')}><Icon name="check" size={16} />Duyệt tin</button>
                    <button type="button" className="outline-button" disabled={busyId !== null} onClick={() => { setRejecting(job.id); setMessage(''); setActionError('') }}>Từ chối</button>
                  </div>
                ))}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
