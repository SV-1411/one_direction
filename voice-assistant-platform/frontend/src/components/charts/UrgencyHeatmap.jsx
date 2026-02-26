import { useMemo, useState } from 'react'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function color(v) {
  if (v >= 0.8) return '#b91c1c'
  if (v >= 0.6) return '#ea580c'
  if (v >= 0.4) return '#f59e0b'
  if (v >= 0.2) return '#fdba74'
  return '#fff7ed'
}

export default function UrgencyHeatmap({ data = [] }) {
  const [hover, setHover] = useState(null)
  const matrix = useMemo(() => {
    const arr = Array.from({ length: 24 }, () => Array.from({ length: 7 }, () => 0))
    data.forEach((item) => {
      const d = new Date(item.timestamp || item.date || Date.now())
      const hr = d.getHours()
      const day = d.getDay()
      arr[hr][day] = Math.max(arr[hr][day], item.urgency_score || item.value || 0)
    })
    return arr
  }, [data])

  return (
    <div className="rounded border bg-white p-3">
      <h3 className="mb-2 font-semibold">Urgency Heatmap</h3>
      <svg viewBox="0 0 420 520" className="w-full">
        {days.map((d, i) => <text key={d} x={70 + i * 48} y={20} fontSize="12">{d}</text>)}
        {matrix.map((row, hour) => (
          <g key={hour}>
            <text x="10" y={45 + hour * 20} fontSize="10">{String(hour).padStart(2, '0')}:00</text>
            {row.map((v, day) => (
              <rect
                key={`${hour}-${day}`}
                x={60 + day * 48}
                y={30 + hour * 20}
                width="40"
                height="16"
                fill={color(v)}
                stroke="#e5e7eb"
                onMouseMove={(e) => setHover({ x: e.clientX, y: e.clientY, hour, day, value: v })}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        ))}
      </svg>
      {hover ? <div className="text-xs text-gray-600">{days[hover.day]} {hover.hour}:00 — {Math.round(hover.value * 100)}%</div> : null}
    </div>
  )
}
