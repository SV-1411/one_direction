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
      </div>
    </div>
  )
}
