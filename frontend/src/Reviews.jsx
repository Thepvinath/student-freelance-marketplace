import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

// FR-10: Đánh giá 1–5 sao sau khi công việc hoàn thành.

const REVIEW_ERRORS = {
  400: 'Hãy chọn từ 1 đến 5 sao. Nhận xét tối đa 1000 ký tự.',
  401: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để đánh giá.',
  403: 'Tài khoản của bạn không được đánh giá đơn này.',
  404: 'Không tìm thấy đơn ứng tuyển này.',
  409: 'Bạn đã đánh giá đơn này, hoặc công việc chưa hoàn thành.',
}

const LABELS = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Rất tốt']

export function Stars({ value, size = 16 }) {
  const rounded = Math.round(value)
  return (
    <span className="stars" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= rounded ? 'on' : ''}><Icon name="star" size={size} /></span>)}
    </span>
  )
}

// Điểm trung bình của một tài khoản (công khai): ★ 4.5 · 2 đánh giá
export function RatingBadge({ userId, empty = 'Chưa có đánh giá' }) {
  const [state, setState] = useState({ key: null, data: null })

  useEffect(() => {
    if (!userId) return undefined
    const controller = new AbortController()
    fetch(`/api/users/${userId}/reviews`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!controller.signal.aborted) setState({ key: userId, data }) })
      .catch(() => {})
    return () => controller.abort()
  }, [userId])

  const data = state.key === userId ? state.data : null
  if (!data) return null
  if (data.count === 0) return <span className="rating-badge muted">{empty}</span>
  return (
    <span className="rating-badge">
      <Icon name="star" size={15} />
      <strong>{data.average.toFixed(1)}</strong>
      <span>({data.count} đánh giá)</span>
    </span>
  )
}

export function ReviewModal({ application, token, targetLabel, onCancel, onDone }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (rating < 1) {
      setError('Hãy chọn số sao trước khi gửi.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/applications/${application.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      })
      if (!response.ok) throw new Error(REVIEW_ERRORS[response.status] || `Gửi đánh giá thất bại (HTTP ${response.status}).`)
      onDone()
    } catch (caught) {
      setError(caught instanceof TypeError ? 'Không kết nối được Spring Boot.' : caught.message)
    } finally {
      setBusy(false)
    }
  }

  const shown = hover || rating
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
      <section className="job-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <div className="modal-heading">
          <div>
            <h2 id="review-title">Đánh giá {targetLabel}</h2>
            <p className="review-sub">Công việc “{application.jobTitle}”</p>
          </div>
          <button type="button" className="close-button" aria-label="Đóng" onClick={onCancel} disabled={busy}><Icon name="close" size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <fieldset className="star-picker">
            <legend>Bạn chấm bao nhiêu sao?</legend>
            <div className="star-row" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)}>
                  <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
                  <Icon name="star" size={34} />
                  <span className="sr-only">{n} sao</span>
                </label>
              ))}
              <span className="star-label">{shown ? LABELS[shown] : 'Chọn số sao'}</span>
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="review-comment">Nhận xét (không bắt buộc)</label>
            <textarea id="review-comment" className="review-textarea" rows={4} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ví dụ: Đúng giờ, nhiệt tình, hướng dẫn rõ ràng..." />
            <small>Đánh giá được gửi một lần và không sửa được.</small>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onCancel} disabled={busy}>Hủy</button>
            <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

// Danh sách đánh giá đã nhận (trang Hồ sơ)
export function ReviewList({ userId }) {
  const [state, setState] = useState({ key: null, data: null, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/users/${userId}/reviews`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(); return response.json() })
      .then((data) => { if (!controller.signal.aborted) setState({ key: userId, data, error: '' }) })
      .catch(() => { if (!controller.signal.aborted) setState({ key: userId, data: null, error: 'Không tải được đánh giá.' }) })
    return () => controller.abort()
  }, [userId])

  const current = state.key === userId ? state : null
  return (
    <section className="review-card" aria-labelledby="reviews-title">
      <div className="review-card-head">
        <h3 id="reviews-title">Đánh giá đã nhận</h3>
        {current?.data && current.data.count > 0 && (
          <div className="review-average"><strong>{current.data.average.toFixed(1)}</strong><Stars value={current.data.average} /><span>{current.data.count} đánh giá</span></div>
        )}
      </div>
      {!current && <p className="review-empty">Đang tải...</p>}
      {current?.error && <p className="form-error">{current.error}</p>}
      {current?.data && current.data.count === 0 && <p className="review-empty">Chưa có đánh giá. Đánh giá xuất hiện sau khi công việc hoàn thành.</p>}
      {current?.data && current.data.count > 0 && (
        <ul className="review-items">
          {current.data.reviews.map((review) => (
            <li key={review.id}>
              <div className="review-item-top"><strong>{review.reviewerName}</strong><Stars value={review.rating} size={14} /></div>
              {review.jobTitle && <p className="review-job">{review.jobTitle}</p>}
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
