export default function UrgencyIndicator({ value = 0 }) {
  const pct = Math.round(value * 100)
  const color = pct < 35 ? 'bg-green-500' : pct < 65 ? 'bg-yellow-500' : pct < 85 ? 'bg-orange-500' : 'bg-red-600'

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-sm">
        <span>Urgency</span>
        <span>{pct}%</span>
      </div>
      <div className="h-3 w-full rounded bg-gray-200">
        <div className={`h-3 rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
