export default function SentimentBadge({ sentiment = 'neutral', score, emoji = true }) {
  const cfg = {
    positive: { cls: 'bg-green-100 text-green-800 border-green-300', icon: '😊' },
    neutral: { cls: 'bg-gray-100 text-gray-800 border-gray-300', icon: '😐' },
    negative: { cls: 'bg-red-100 text-red-800 border-red-300', icon: '😟' },
  }[sentiment] || { cls: 'bg-gray-100 text-gray-800 border-gray-300', icon: '😐' }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${cfg.cls}`}>
      {emoji ? <span>{cfg.icon}</span> : null}
      <span className="capitalize">{sentiment}</span>
      {typeof score === 'number' ? <span>({Math.round(score * 100)}%)</span> : null}
    </span>
  )
}
