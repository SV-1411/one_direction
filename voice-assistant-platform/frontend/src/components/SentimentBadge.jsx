import Badge from './ui/Badge'

export default function SentimentBadge({ sentiment, score }) {
  const getVariant = () => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'success'
      case 'negative': return 'danger'
      case 'neutral': return 'info'
      default: return 'default'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getVariant()} className="capitalize">
        {sentiment || 'neutral'}
      </Badge>
      {score !== undefined && (
        <span className="text-[10px] font-mono font-bold text-slate-400">
          {Math.round(score * 100)}%
        </span>
      )}
    </div>
  )
}
