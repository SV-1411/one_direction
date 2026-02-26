import Badge from './ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

export default function FraudRiskMeter({ score = 0 }) {
  const pct = Math.round(score * 100)
  const getVariant = () => {
    if (score > 0.8) return 'danger'
    if (score > 0.5) return 'warning'
    return 'success'
  }

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="py-3 bg-slate-50/30 border-b border-slate-100/50">
        <CardTitle className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Fraud Risk</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-slate-50 shadow-inner">
            <span className={`text-xl font-bold font-mono ${score > 0.8 ? 'text-rose-600' : score > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pct}%
            </span>
            <svg className="absolute inset-[-4px] w-[88px] h-[88px] -rotate-90">
              <circle
                cx="44"
                cy="44"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-100"
              />
              <circle
                cx="44"
                cy="44"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * pct) / 100}
                className={`${score > 0.8 ? 'text-rose-500' : score > 0.5 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
          </div>
          <Badge variant={getVariant()} className="px-3 py-1 font-bold uppercase tracking-tighter">
            {score > 0.8 ? 'High Risk' : score > 0.5 ? 'Suspicious' : 'Safe'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
