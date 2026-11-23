import { TIME_OPTIONS, toMinutes } from './jobUtils.js'

// Chọn giờ bắt đầu và giờ kết thúc trong cùng một ô (Sprint 4).
// value = { from: 'HH:mm' | '', to: 'HH:mm' | '' }
export function TimeRangeField({ id, value, onChange, anyLabel = 'Bất kỳ', compact = false }) {
  const invalid = value.from && value.to && toMinutes(value.to) <= toMinutes(value.from)

  function set(part, next) {
    const updated = { ...value, [part]: next }
    // Chọn giờ bắt đầu mà chưa có giờ kết thúc: gợi ý kết thúc sau 2 giờ.
    if (part === 'from' && next && !value.to) {
      const index = TIME_OPTIONS.indexOf(next)
      updated.to = TIME_OPTIONS[Math.min(index + 4, TIME_OPTIONS.length - 1)]
    }
    if (part === 'from' && !next) updated.to = ''
    onChange(updated)
  }

  return (
    <div className={`time-range ${compact ? 'compact' : ''} ${invalid ? 'invalid' : ''}`} role="group" aria-labelledby={`${id}-label`}>
      <label className="time-part">
        <span>Từ</span>
        <select id={`${id}-from`} value={value.from} onChange={(event) => set('from', event.target.value)} aria-label="Giờ bắt đầu">
          <option value="">{anyLabel}</option>
          {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
        </select>
      </label>
      <span className="time-dash" aria-hidden="true" />
      <label className="time-part">
        <span>Đến</span>
        <select id={`${id}-to`} value={value.to} onChange={(event) => set('to', event.target.value)} aria-label="Giờ kết thúc" disabled={!value.from}>
          <option value="">{anyLabel}</option>
          {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
        </select>
      </label>
    </div>
  )
}

// Thanh 24 giờ: tô đoạn từ `from` đến `to`. Không có giờ = sọc "linh hoạt".
export function DayBar({ from, to, period = 'evening', size = 'small' }) {
  const start = toMinutes(from)
  const end = toMinutes(to)
  const has = start !== null && end !== null && end > start
  return (
    <div className={`day-bar ${size}`} aria-hidden="true">
      <div className="day-track">
        {has
          ? <span className={`day-fill period-${period}`} style={{ left: `${(start / 1440) * 100}%`, width: `${((end - start) / 1440) * 100}%` }} />
          : <span className="day-fill period-flex" style={{ left: 0, width: '100%' }} />}
      </div>
      {size === 'large' && (
        <div className="day-ticks">{['00', '06', '12', '18', '24'].map((t) => <span key={t}>{t}h</span>)}</div>
      )}
    </div>
  )
}
