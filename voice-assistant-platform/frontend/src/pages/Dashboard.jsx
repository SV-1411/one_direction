import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import SentimentTrendChart from '../components/charts/SentimentTrendChart'
import SessionVolumeChart from '../components/charts/SessionVolumeChart'

function Stat({ label, value }) {
  return <div className="rounded border bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    analyticsAPI.getDashboard().then((res) => setData(res.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Stat label="Total Sessions" value={data?.total_sessions ?? '-'} />
        <Stat label="Active Sessions" value={data?.active_sessions ?? '-'} />
        <Stat label="Fraud Alerts Today" value={data?.fraud_alerts_count ?? '-'} />
        <Stat label="Avg Sentiment" value={data?.avg_sentiment_score_7d ?? '-'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SentimentTrendChart data={data?.sentiment_trend || []} />
        <SessionVolumeChart data={data?.session_volume || []} />
      </div>

      <div className="rounded border bg-white p-3">
        <h3 className="mb-3 font-semibold">Urgency Distribution</h3>
        <pre className="text-xs">{JSON.stringify(data?.urgency_distribution || {}, null, 2)}</pre>
      </div>
    </div>
  )
}
