import { useEffect, useState } from 'react'
import { authAPI, integrationsAPI } from '../api/client'
import { useAuthStore } from '../store/authStore'

const mask = (v = '') => (v ? `${v.slice(0, 4)}****...****${v.slice(-3)}` : '')

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const [apiKey, setApiKey] = useState(user?.api_key || '')
  const [health, setHealth] = useState(null)
  const [fraudThreshold, setFraudThreshold] = useState(0.65)
  const [urgencyThreshold, setUrgencyThreshold] = useState(0.8)

  useEffect(() => {
    integrationsAPI.getHealth().then((r) => setHealth(r.data)).catch(() => {})
  }, [])

  const regenerate = async () => {
    if (!confirm('Regenerate API key?')) return
    const { data } = await authAPI.regenerateApiKey()
    setApiKey(data.api_key)
  }

  return (
    <div className="space-y-4 p-4">
      <section className="rounded border bg-white p-3">
        <h3 className="mb-2 font-semibold">API Key</h3>
        <div className="flex items-center gap-2"><code>{mask(apiKey)}</code><button className="rounded border px-2 py-1" onClick={() => navigator.clipboard.writeText(apiKey)}>Copy</button><button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={regenerate}>Regenerate</button></div>
      </section>

      <section className="rounded border bg-slate-900 p-3 border-slate-700">
        <h3 className="mb-2 font-semibold text-slate-100">System Health</h3>
        {health?.models && Object.entries(health.models).map(([name, status]) => (
          <div key={name} className="flex items-center justify-between py-2 border-b border-slate-700">
            <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${status.available ? 'bg-green-400' : 'bg-red-400'}`} /><span className="text-sm text-slate-300 capitalize">{name}</span></div>
            <div className="text-right"><p className="text-xs text-slate-400">{status.model_name || status.model || ''}</p>{status.load_time_ms ? <p className="text-xs text-slate-500">{status.load_time_ms}ms load time</p> : null}{status.error ? <p className="text-xs text-red-400">{status.error}</p> : null}</div>
          </div>
        ))}
      </section>

      <section className="rounded border bg-white p-3">
        <h3 className="mb-2 font-semibold">Thresholds</h3>
        <label className="text-sm">Fraud Alert Threshold</label>
        <input type="range" min="0.5" max="0.95" step="0.05" value={fraudThreshold} onChange={(e) => setFraudThreshold(parseFloat(e.target.value))} className="w-full accent-blue-500" />
        <p className="text-sm text-slate-400">Current: {fraudThreshold} — alerts trigger above this score</p>
        <label className="text-sm mt-2 block">Urgency Alert Threshold</label>
        <input type="range" min="0.5" max="0.95" step="0.05" value={urgencyThreshold} onChange={(e) => setUrgencyThreshold(parseFloat(e.target.value))} className="w-full accent-blue-500" />
        <p className="text-sm text-slate-400">Current: {urgencyThreshold} — alerts trigger above this score</p>
      </section>
    </div>
  )
}
