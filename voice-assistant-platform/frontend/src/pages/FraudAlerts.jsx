import { useEffect, useMemo, useState } from 'react'
import { analyticsAPI } from '../api/client'

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([])
  const [risk, setRisk] = useState('all')
  const [expanded, setExpanded] = useState('')

  useEffect(() => {
    analyticsAPI.getFraudAlerts({ page: 1, limit: 200 }).then((r) => setAlerts(r.data.items || [])).catch(() => {})
  }, [])

  const filtered = useMemo(() => alerts.filter((a) => {
    if (risk === 'all') return true
    if (risk === 'high') return (a.peak_fraud_score || 0) > 0.8
    if (risk === 'medium') return (a.peak_fraud_score || 0) >= 0.65 && (a.peak_fraud_score || 0) <= 0.8
    return true
  }), [alerts, risk])

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border bg-white p-3">Total Alerts: {alerts.length}</div>
        <div className="rounded border bg-white p-3">High Risk: {alerts.filter((a) => (a.peak_fraud_score || 0) > 0.8).length}</div>
        <div className="rounded border bg-white p-3">Medium Risk: {alerts.filter((a) => (a.peak_fraud_score || 0) >= 0.65 && (a.peak_fraud_score || 0) <= 0.8).length}</div>
      </div>

      <select className="rounded border px-2 py-1" value={risk} onChange={(e) => setRisk(e.target.value)}><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option></select>

      <div className="rounded border bg-white p-3">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Session</th><th>Time</th><th>Fraud</th><th>Risk</th><th>Signals</th><th>Channel</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <>
                <tr key={a.session_id} className="border-t cursor-pointer" onClick={() => setExpanded(expanded === a.session_id ? '' : a.session_id)}>
                  <td>{a.session_id}</td><td>{new Date(a.started_at).toLocaleString()}</td><td>{Math.round((a.peak_fraud_score || 0) * 100)}%</td><td>{(a.peak_fraud_score || 0) > 0.8 ? 'High' : 'Medium'}</td><td>-</td><td>{a.channel}</td><td><button className="rounded border px-2 py-1">Mark Reviewed</button></td>
                </tr>
                {expanded === a.session_id ? <tr><td colSpan={7} className="bg-gray-50 p-2 text-xs">Conversation preview for {a.session_id}</td></tr> : null}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
