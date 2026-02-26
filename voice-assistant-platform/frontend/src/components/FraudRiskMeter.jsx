export default function FraudRiskMeter({ score = 0 }) {
  const radius = 60
  const cx = 80
  const cy = 80
  const startAngle = Math.PI
  const angle = startAngle + score * Math.PI

  const polarToCartesian = (ccx, ccy, r, a) => ({ x: ccx + r * Math.cos(a), y: ccy + r * Math.sin(a) })
  const arcPath = (startA, endA) => {
    const s = polarToCartesian(cx, cy, radius, startA)
    const e = polarToCartesian(cx, cy, radius, endA)
    const large = endA - startA > Math.PI ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const needleEnd = polarToCartesian(cx, cy, radius - 8, angle)
  const color = score < 0.4 ? '#22c55e' : score < 0.65 ? '#eab308' : '#ef4444'
  const label = score < 0.4 ? 'Low' : score < 0.65 ? 'Medium' : 'High'

  return (
    <div className="flex flex-col items-center bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Fraud Risk</p>
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path d={arcPath(Math.PI, 2 * Math.PI)} fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(Math.PI, Math.PI + 0.4 * Math.PI)} fill="none" stroke="#166534" strokeWidth="12" />
        <path d={arcPath(Math.PI + 0.4 * Math.PI, Math.PI + 0.65 * Math.PI)} fill="none" stroke="#713f12" strokeWidth="12" />
        <path d={arcPath(Math.PI + 0.65 * Math.PI, 2 * Math.PI)} fill="none" stroke="#7f1d1d" strokeWidth="12" />
        <path d={arcPath(Math.PI, angle)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="white" />
        <text x={cx} y={cy + 20} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
          {Math.round(score * 100)}%
        </text>
      </svg>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${score < 0.4 ? 'bg-green-900 text-green-300' : score < 0.65 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}
      >
        {label} Risk
      </span>
    </div>
  )
}
