function getSegmentClass(index, current) {
  if (index >= current) {
    return 'fill-[rgba(255,255,255,0.16)]'
  }

  if (current <= 1) {
    return 'fill-[var(--color-danger)]'
  }

  if (current <= 3) {
    return 'fill-[#c98a38]'
  }

  return 'fill-[var(--color-success)]'
}

export default function HpBar({ current = 5, max = 5 }) {
  const width = max * 18 + 6

  return (
    <svg width={width} height="18" viewBox={`0 0 ${width} 18`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width={width - 2} height="16" rx="4" className="fill-[#20150D]" />
      {Array.from({ length: max }, (_, index) => {
        const x = index * 18 + 4

        return (
          <g key={x}>
            <rect x={x} y="4" width="14" height="10" className="fill-[rgba(255,255,255,0.08)]" />
            <rect x={x} y="4" width="14" height="10" className={getSegmentClass(index, current)} />
          </g>
        )
      })}
    </svg>
  )
}