import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { externalCvLink, isUploadedCv, openUploadedCv, uploadCv } from './cvApi.js'

// Sprint 5: ô chọn CV (PDF) và nút xem CV – xem cvApi.js
// Nút "Xem CV" dùng chung: CV đã tải lên → mở kèm token; liên kết ngoài → mở thẳng.
export function CvViewLink({ url, token, label = 'Xem CV ↗' }) {
  const [error, setError] = useState('')
  if (isUploadedCv(url)) {
    return (
      <span className="cv-view">
        <button type="button" className="link-button" onClick={() => { setError(''); openUploadedCv(url, token).catch((e) => setError(e.message)) }}>{label}</button>
        {error && <small className="cv-view-error" role="alert">{error}</small>}
      </span>
    )
  }
  const link = externalCvLink(url)
  return link ? <a href={link} target="_blank" rel="noopener noreferrer">{label}</a> : null
}

// Ô chọn CV dùng trong Hồ sơ và form Ứng tuyển.
// value: cvUrl hiện tại; onChange(url, info) nhận đường dẫn mới sau khi tải lên (hoặc '' khi bỏ CV).
export function CvPicker({ id, value, token, onChange, hint, fileName }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [viewError, setViewError] = useState('')

  async function choose(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const saved = await uploadCv(file, token)
      onChange(saved.url, saved)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  const uploaded = isUploadedCv(value)
  const external = !uploaded && externalCvLink(value)
  return (
    <div className="cv-picker">
      <div className={`cv-current ${value ? 'has-cv' : ''}`}>
        <span className="cv-icon" aria-hidden="true"><Icon name="book" size={20} /></span>
        <span className="cv-text">
          <strong>{uploaded ? (fileName || 'CV đã tải lên (PDF)') : external ? 'CV dạng liên kết' : 'Chưa có CV'}</strong>
          <small>{hint}</small>
        </span>
        {uploaded && <button type="button" className="text-button" onClick={() => { setViewError(''); openUploadedCv(value, token).catch((e) => setViewError(e.message)) }}>Xem</button>}
        {external && <a className="text-button" href={external} target="_blank" rel="noopener noreferrer">Xem ↗</a>}
      </div>
      <div className="cv-actions">
        <input ref={input} id={id} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={choose} disabled={busy} />
        <button type="button" className="outline-button small" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Đang tải lên...' : value ? 'Chọn file khác' : 'Chọn file PDF'}
        </button>
        {value && !busy && <button type="button" className="text-button" onClick={() => onChange('', null)}>Bỏ CV</button>}
        <small>PDF, tối đa 5 MB</small>
      </div>
      {(error || viewError) && <p className="form-error cv-error" role="alert">{error || viewError}</p>}
    </div>
  )
}
