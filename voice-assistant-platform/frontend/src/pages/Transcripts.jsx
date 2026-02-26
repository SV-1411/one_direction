import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import SentimentBadge from '../components/SentimentBadge'

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
    const res = await analyticsAPI.getSession(sessionId)
    setMessages(res.data.messages || [])
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <div className="bg-white rounded border p-3">
        <input className="w-full border rounded px-2 py-1 mb-2" placeholder="Search by session id" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">{filtered.map((s) => <button key={s.session_id} onClick={() => loadMessages(s.session_id)} className={`w-full text-left border rounded px-2 py-1 ${selected === s.session_id ? 'bg-blue-50' : ''}`}>{s.session_id}</button>)}</div>
      </div>

      <div className="lg:col-span-2 bg-slate-900 rounded border border-slate-700 p-3">
        <div className="flex gap-2 mb-3"><button onClick={exportJSON} className="border border-slate-600 rounded px-2 py-1 text-slate-100">Export JSON</button><button onClick={exportTXT} className="border border-slate-600 rounded px-2 py-1 text-slate-100">Export TXT</button></div>
        <div className="max-h-[70vh] overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg._id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-700 text-slate-100 rounded-bl-sm'}`}>
                <p className="text-sm">{msg.transcript || msg.response}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs opacity-70">{formatTime(msg.timestamp)}</span>
                  {msg.sentiment && <SentimentBadge sentiment={msg.sentiment} score={msg.sentiment_score} />}
                  {msg.urgency_score > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">⚡ {Math.round(msg.urgency_score * 100)}%</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
