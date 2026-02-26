<<<<<<< HEAD
import { useEffect, useState } from 'react'
import { authAPI, integrationsAPI } from '../api/client'
import { useAuthStore } from '../store/authStore'
=======
import { Settings as SettingsIcon, ShieldAlert, Zap, Activity } from 'lucide-react'
import { authAPI, integrationsAPI } from '../api/client'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Page, PageHeader, PageSubTitle, PageTitle } from '../components/ui/Page'
import { useEffect, useState } from 'react'
>>>>>>> backup-new-ui

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
<<<<<<< HEAD
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
=======
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Settings</PageTitle>
          <PageSubTitle>Keys, health, and alert thresholds</PageSubTitle>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <code className="text-sm">{mask(apiKey)}</code>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(apiKey)}>Copy</Button>
              <Button size="sm" onClick={regenerate}>Regenerate</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-slate-700 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="text-sm font-semibold text-slate-100">System Health</div>
        </div>
        <div className="px-4 py-2">
          {health?.models && Object.entries(health.models).map(([name, status]) => (
            <div key={name} className="flex items-center justify-between gap-4 py-2 border-b border-slate-800 last:border-b-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                  <SettingsIcon size={16} />
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${status.available ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-slate-200 capitalize">{name}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-300">{status.model_name || status.model || ''}</p>
                {status.load_time_ms ? <p className="text-xs text-slate-500">{status.load_time_ms}ms load time</p> : null}
                {status.error ? <p className="text-xs text-red-400">{status.error}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="text-sm font-medium text-slate-700">Fraud Alert Threshold</label>
          <input type="range" min="0.5" max="0.95" step="0.05" value={fraudThreshold} onChange={(e) => setFraudThreshold(parseFloat(e.target.value))} className="w-full accent-blue-600" />
          <p className="text-sm text-slate-500">Current: {fraudThreshold} — alerts trigger above this score</p>

          <label className="mt-4 block text-sm font-medium text-slate-700">Urgency Alert Threshold</label>
          <input type="range" min="0.5" max="0.95" step="0.05" value={urgencyThreshold} onChange={(e) => setUrgencyThreshold(parseFloat(e.target.value))} className="w-full accent-blue-600" />
          <p className="text-sm text-slate-500">Current: {urgencyThreshold} — alerts trigger above this score</p>
        </CardContent>
      </Card>
    </Page>
>>>>>>> backup-new-ui
  )
}
