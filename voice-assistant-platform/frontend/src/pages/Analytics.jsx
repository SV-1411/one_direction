import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import Input from '../components/ui/Input'
import { Page, PageActions, PageHeader, PageSubTitle, PageTitle } from '../components/ui/Page'
import Select from '../components/ui/Select'

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
    <Page className="max-w-7xl">
      <PageHeader className="mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-600">Data Intelligence</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight text-slate-900">Session Analytics</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Comprehensive log analysis and interaction metadata.</PageSubTitle>
        </div>
        <PageActions>
          <Button variant="outline" onClick={exportCsv} className="rounded-xl px-6 border-emerald-100 hover:bg-emerald-50 transition-all">
            <span className="flex items-center gap-2">📥 Export Dataset</span>
          </Button>
        </PageActions>
      </PageHeader>

      <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 backdrop-blur-sm overflow-hidden mb-8">
        <CardHeader className="bg-slate-50/30 border-b border-slate-100/50 px-8 py-4">
          <CardTitle className="text-xs uppercase tracking-widest text-slate-500 font-bold">Query Parameters</CardTitle>
        </CardHeader>
        <CardContent className="px-8 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border-slate-100 bg-white shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border-slate-100 bg-white shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Source</label>
              <Select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-xl border-slate-100 bg-white shadow-sm">
                <option value="">All Channels</option>
                <option value="web">Web Interface</option>
                <option value="whatsapp">WhatsApp API</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Escalation</label>
              <Select value={escalation} onChange={(e) => setEscalation(e.target.value)} className="rounded-xl border-slate-100 bg-white shadow-sm">
                <option value="">Status: All</option>
                <option value="true">Escalated Only</option>
                <option value="false">Standard Flow</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Polarity</label>
              <Select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="rounded-xl border-slate-100 bg-white shadow-sm">
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden mb-12">
        <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-extrabold tracking-tight">Interaction Records</CardTitle>
              <CardDescription className="font-medium text-slate-400 italic">Showing {total ? startIndex : 0}–{endIndex} of {total} processed streams</CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-100 text-emerald-600 font-mono text-[10px] px-3">PAGE_{page}_OF_{lastPage}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-50">
                  <th className="px-8 pb-4 font-bold uppercase tracking-widest text-[10px]">Reference ID</th>
                  <th className="px-4 pb-4 font-bold uppercase tracking-widest text-[10px]">Timestamp</th>
                  <th className="px-4 pb-4 font-bold uppercase tracking-widest text-[10px]">Channel</th>
                  <th className="px-4 pb-4 font-bold uppercase tracking-widest text-[10px]">Sentiment</th>
                  <th className="px-4 pb-4 font-bold uppercase tracking-widest text-[10px]">Urgency</th>
                  <th className="px-4 pb-4 font-bold uppercase tracking-widest text-[10px]">Risk</th>
                  <th className="px-8 pb-4 font-bold uppercase tracking-widest text-[10px]">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.map((s) => (
                  <tr key={s.session_id} className="group hover:bg-emerald-50/30 transition-all duration-200">
                    <td className="px-8 py-4 font-mono text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">{s.session_id.slice(0, 12)}...</td>
                    <td className="px-4 py-4 font-medium text-slate-600 whitespace-nowrap">{new Date(s.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="default" className="bg-slate-100 text-slate-500 border-transparent capitalize text-[10px] font-black">{s.channel}</Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant={s.final_sentiment === 'positive' ? 'success' : s.final_sentiment === 'negative' ? 'danger' : 'info'} className="capitalize text-[10px] font-black">{s.final_sentiment || 'neutral'}</Badge>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{Math.round((s.peak_urgency_score || 0) * 100)}%</td>
                    <td className="px-4 py-4 font-bold text-slate-700">{Math.round((s.peak_fraud_score || 0) * 100)}%</td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      {s.escalation_required ? 
                        <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 shadow-lg shadow-rose-200 animate-pulse" /> : 
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-30" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1} 
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-6 font-black tracking-tighter"
            >
              PREVIOUS
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation Interface</span>
              <div className="flex gap-1">
                {[...Array(Math.min(5, lastPage))].map((_, i) => (
                  <div key={i} className={`h-1 w-4 rounded-full ${page === i + 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= lastPage} 
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-6 font-black tracking-tighter"
            >
              NEXT_STEP
            </Button>
          </div>
        </CardContent>
      </Card>
    </Page>
  )
}
