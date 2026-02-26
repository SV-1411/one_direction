import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'

function convertToCSV(data) {
  if (!data.length) return ''
  const keys = ['session_id', 'started_at', 'channel', 'status', 'final_sentiment', 'peak_urgency_score', 'peak_fraud_score', 'escalation_required']
  const header = `${keys.join(',')}\n`
  const rows = data.map((d) => keys.map((k) => JSON.stringify(d[k] ?? '')).join(',')).join('\n')
  return header + rows
}

export default function Analytics() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [channel, setChannel] = useState('')
  const [escalation, setEscalation] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    analyticsAPI
      .getSessions({ startDate, endDate, channel, escalation, sentiment, page, pageSize })
      .then((r) => {
        setSessions(r.data.items || [])
        setTotal(r.data.total || 0)
      })
      .catch(() => {})
  }, [startDate, endDate, channel, escalation, sentiment, page, pageSize])

  const exportCsv = () => {
    const blob = new Blob([convertToCSV(sessions)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'analytics_sessions.csv'
    a.click()
  }

  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, total)
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-white rounded border p-3">
        <input type="date" className="border rounded px-2 py-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <select className="border rounded px-2 py-1" value={channel} onChange={(e) => setChannel(e.target.value)}><option value="">All channel</option><option value="web">Web</option><option value="whatsapp">WhatsApp</option></select>
        <select className="border rounded px-2 py-1" value={escalation} onChange={(e) => setEscalation(e.target.value)}><option value="">All</option><option value="true">Escalated</option><option value="false">Not escalated</option></select>
        <select className="border rounded px-2 py-1" value={sentiment} onChange={(e) => setSentiment(e.target.value)}><option value="">All sentiment</option><option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option></select>
        <button className="rounded bg-blue-600 text-white px-3 py-1" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="bg-white rounded border p-3">
        <p className="text-sm text-gray-600 mb-2">Showing {total ? startIndex : 0}–{endIndex} of {total} sessions</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>ID</th><th>Started</th><th>Channel</th><th>Sentiment</th><th>Urgency</th><th>Fraud</th><th>Escalated</th></tr></thead>
          <tbody>
            {sessions.map((s) => <tr key={s.session_id} className="border-t"><td>{s.session_id}</td><td>{new Date(s.started_at).toLocaleString()}</td><td>{s.channel}</td><td>{s.final_sentiment || '-'}</td><td>{Math.round((s.peak_urgency_score || 0) * 100)}%</td><td>{Math.round((s.peak_fraud_score || 0) * 100)}%</td><td>{s.escalation_required ? 'Yes' : 'No'}</td></tr>)}
          </tbody>
        </table>
        <div className="mt-3 flex justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border rounded px-3 py-1 disabled:opacity-40">Prev</button>
          <span>Page {page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="border rounded px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}
