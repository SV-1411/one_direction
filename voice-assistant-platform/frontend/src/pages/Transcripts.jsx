import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import SentimentBadge from '../components/SentimentBadge'
import Button from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { Page, PageHeader, PageSubTitle, PageTitle } from '../components/ui/Page'
import { ScrollText, Search, Clock, ShieldAlert } from 'lucide-react'

const formatTime = (ts) => new Date(ts).toLocaleTimeString()

export default function Transcripts() {
  const [sessions, setSessions] = useState([])
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')

  useEffect(() => {
    analyticsAPI.getSessions({ page: 1, pageSize: 100 }).then((r) => setSessions(r.data.items || [])).catch(() => {})
  }, [])

  const loadMessages = async (sessionId) => {
    setSelected(sessionId)
    try {
      const res = await analyticsAPI.getSession(sessionId)
      setMessages(res.data.messages || [])
    } catch (e) { console.error(e) }
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${selected || 'transcript'}.json`
    a.click()
  }
  const exportTXT = () => {
    const txt = messages.map((m) => `[${formatTime(m.timestamp)}] ${m.role === 'user' ? 'User' : 'AI'}: ${m.transcript || m.response || ''}`).join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${selected || 'transcript'}.txt`
    a.click()
  }

  const filtered = sessions.filter((s) => s.session_id.includes(search))

  return (
    <Page className="max-w-7xl">
      <PageHeader className="mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-600">Archive Retrieval</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight text-slate-900">Interaction Logs</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Deep-dive into historical cognitive interaction streams.</PageSubTitle>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        <Card className="lg:col-span-4 border-none shadow-xl bg-white/70 backdrop-blur-sm overflow-hidden h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/50 px-6 py-4 flex flex-col gap-4">
            <CardTitle className="text-xs uppercase tracking-widest text-slate-500 font-bold">Session Explorer</CardTitle>
            <Input 
              placeholder="Search reference ID..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border-slate-100 rounded-xl text-xs h-9"
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {filtered.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => loadMessages(s.session_id)}
                  className={`w-full text-left rounded-xl px-4 py-3 transition-all duration-200 group ${
                    selected === s.session_id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className={`font-mono text-[10px] font-bold ${selected === s.session_id ? 'text-emerald-100' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                      {s.session_id.slice(0, 16)}...
                    </div>
                    <div className="text-xs font-bold truncate">Stream Entry Point</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6 flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
          <div className="glass rounded-[2.5rem] p-1 shadow-2xl shadow-emerald-900/5 overflow-hidden flex-1 flex flex-col">
            <div className="bg-slate-900 rounded-[2.3rem] flex-1 flex flex-col overflow-hidden relative border border-white/5 shadow-inner">
              <div className="px-8 py-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${selected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">Cognitive Stream</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{selected ? `REF: ${selected}` : 'No session selected'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportJSON} disabled={!selected} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl text-[10px] font-black tracking-widest uppercase">JSON</Button>
                  <Button variant="outline" size="sm" onClick={exportTXT} disabled={!selected} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl text-[10px] font-black tracking-widest uppercase">TXT</Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scroll-smooth">
                {selected ? (
                  messages.length > 0 ? (
                    messages.map((msg, i) => (
                      <div key={msg._id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`} style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={`relative max-w-sm lg:max-w-md px-6 py-4 rounded-[1.8rem] shadow-2xl ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm shadow-emerald-900/20' 
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-white/5'
                        }`}>
                          <p className="text-sm leading-relaxed font-medium">{msg.transcript || msg.response}</p>
                          <div className="flex items-center gap-3 mt-4 flex-wrap border-t border-white/10 pt-3">
                            <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                            {msg.sentiment && <SentimentBadge sentiment={msg.sentiment} score={msg.sentiment_score} />}
                            {msg.urgency_score > 0 && (
                              <Badge variant="outline" className="text-[10px] font-black bg-black/20 border-transparent text-white">
                                ⚡ {Math.round(msg.urgency_score * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
                      <div className="text-5xl">🌑</div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">Empty Stream Data</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20 opacity-20 group">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-500 flex items-center justify-center animate-spin duration-[10s] group-hover:scale-110 transition-transform">
                      <ScrollText size={40} className="text-emerald-500" />
                    </div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Select session to begin retrieval</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}
