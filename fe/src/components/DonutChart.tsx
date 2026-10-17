export const donutColors = ['#009dd9', '#e8890c', '#16a064', '#dc3b3b', '#7a5bd6', '#8b929c']

export function DonutChart({ values, total, label }: { values: number[]; total: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const sum = values.reduce((a, b) => a + b, 0) || 1
  const starts = values.map((_, i) => values.slice(0, i).reduce((a, b) => a + b, 0))

  return (
    <svg viewBox="0 0 140 140" className="mx-auto h-40 w-40" role="img" aria-label={`${total} ${label}`}>
      <g transform="rotate(-90 70 70)">
        {values.map((v, i) => {
          const len = (v / sum) * c
          return (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={donutColors[i % donutColors.length]}
              strokeWidth="22"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-(starts[i] / sum) * c}
            />
          )
        })}
      </g>
      <text x="70" y="72" textAnchor="middle" className="fill-ink text-[26px] font-bold">
        {total}
      </text>
      <text x="70" y="90" textAnchor="middle" className="fill-muted text-[11px]">
        {label}
      </text>
    </svg>
  )
}
