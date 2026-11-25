import { EMPLOYMENT_TYPES, employmentTypeOf } from './jobUtils.js'

// Sprint 5: nhãn Bán thời gian / Toàn thời gian, mỗi loại một màu
export function TypeBadge({ job, size = 'md' }) {
  const type = employmentTypeOf(job)
  return <span className={`type-badge type-${type === 'FULL_TIME' ? 'full' : 'part'} ${size}`}>{EMPLOYMENT_TYPES[type].label}</span>
}
