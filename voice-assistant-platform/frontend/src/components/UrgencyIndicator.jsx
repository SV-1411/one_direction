<<<<<<< HEAD
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
=======
import Badge from './ui/Badge'

export default function UrgencyIndicator({ value }) {
  const pct = Math.round(value * 100)
  const isHigh = value > 0.8
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Urgency</span>
        <Badge variant={isHigh ? 'danger' : value > 0.5 ? 'warning' : 'info'}>
          {pct}%
        </Badge>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${isHigh ? 'bg-rose-500' : value > 0.5 ? 'bg-amber-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
>>>>>>> backup-new-ui
      </div>
    </div>
  )
}
