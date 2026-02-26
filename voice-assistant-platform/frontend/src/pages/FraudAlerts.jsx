import { useEffect, useMemo, useState } from 'react'
<<<<<<< HEAD
import { analyticsAPI } from '../api/client'
=======
import { AlertTriangle, ShieldAlert, Zap, Clock } from 'lucide-react'
import React from 'react'
import { analyticsAPI } from '../api/client'
import Button from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Page, PageHeader, PageSubTitle, PageTitle, PageActions } from '../components/ui/Page'
import Badge from '../components/ui/Badge'
>>>>>>> backup-new-ui

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
<<<<<<< HEAD
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
=======
    <Page className="max-w-7xl">
      <PageHeader className="mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-rose-600">Risk Mitigation</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight text-slate-900">Fraud Alerts</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Real-time triage and review of suspicious cognitive patterns.</PageSubTitle>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <Card className="border-none shadow-xl bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1">Total Alerts</p>
            <p className="text-3xl font-black text-slate-900">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-rose-50/50 backdrop-blur-sm border border-rose-100/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-400 mb-1">High Risk</p>
            <p className="text-3xl font-black text-rose-600">{alerts.filter((a) => (a.peak_fraud_score || 0) > 0.8).length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-amber-50/50 backdrop-blur-sm border border-amber-100/50">
          <CardContent className="p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-400 mb-1">Elevated Risk</p>
            <p className="text-3xl font-black text-amber-600">{alerts.filter((a) => (a.peak_fraud_score || 0) >= 0.65 && (a.peak_fraud_score || 0) <= 0.8).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Triage Level</span>
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
            {['all', 'high', 'medium'].map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                  risk === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === 'all' ? 'FULL_SCAN' : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-50">
                  <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px]">Reference</th>
                  <th className="px-4 py-6 font-bold uppercase tracking-widest text-[10px]">Detection Time</th>
                  <th className="px-4 py-6 font-bold uppercase tracking-widest text-[10px]">Risk Score</th>
                  <th className="px-4 py-6 font-bold uppercase tracking-widest text-[10px]">Priority</th>
                  <th className="px-4 py-6 font-bold uppercase tracking-widest text-[10px]">Source</th>
                  <th className="px-8 py-6 font-bold uppercase tracking-widest text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((a) => (
                  <React.Fragment key={a.session_id}>
                    <tr
                      className={`group cursor-pointer transition-all duration-200 ${expanded === a.session_id ? 'bg-slate-50/80' : 'hover:bg-emerald-50/30'}`}
                      onClick={() => setExpanded(expanded === a.session_id ? '' : a.session_id)}
                    >
                      <td className="px-8 py-5 font-mono text-[11px] font-bold text-slate-400 group-hover:text-emerald-600">{a.session_id.slice(0, 12)}...</td>
                      <td className="px-4 py-5 font-medium text-slate-600">{new Date(a.started_at).toLocaleString()}</td>
                      <td className="px-4 py-5 font-black text-slate-900">{Math.round((a.peak_fraud_score || 0) * 100)}%</td>
                      <td className="px-4 py-5">
                        <Badge variant={(a.peak_fraud_score || 0) > 0.8 ? 'danger' : 'warning'} className="px-3 py-0.5 text-[10px] font-black uppercase">
                          {(a.peak_fraud_score || 0) > 0.8 ? 'CRITICAL' : 'ELEVATED'}
                        </Badge>
                      </td>
                      <td className="px-4 py-5">
                        <Badge variant="default" className="bg-slate-100 text-slate-500 border-transparent text-[10px] font-black uppercase tracking-tighter">{a.channel}</Badge>
                      </td>
                      <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] tracking-widest uppercase border-slate-200 hover:border-emerald-500 hover:bg-emerald-50">RESOLVE</Button>
                      </td>
                    </tr>
                    {expanded === a.session_id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-8 py-8 animate-in slide-in-from-top-2 duration-300">
                          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Stream Intelligence Preview</h4>
                              <span className="font-mono text-[10px] text-slate-300">REF: {a.session_id}</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-sm text-slate-500 italic leading-relaxed text-center py-4">Loading conversation cognitive stream from GML layer...</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Page>
>>>>>>> backup-new-ui
  )
}
