import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { Search, Clock, Brain } from 'lucide-react'

export default function MemoryTimeline({ events = [], onSearch }) {
  const [query, setQuery] = useState('')

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Card className="border-none shadow-xl bg-white/70 backdrop-blur-sm overflow-hidden text-slate-900">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Search Cognitive Events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Filter timeline by keywords..." 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 rounded-xl border-slate-100 bg-white"
                />
              </div>
            </div>
            <Button onClick={() => onSearch(query)} className="rounded-xl px-8 h-10 font-bold tracking-tight shadow-lg shadow-emerald-200">
              FILTER_STREAM
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pb-12">
        {events.length > 0 ? (
          events.map((e, i) => (
            <div key={e.event_id || e._id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 z-10">
                <Brain size={18} strokeWidth={2.5} />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-300">
                  <CardHeader className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LOGGED'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black border-emerald-100 text-emerald-600 bg-emerald-50/50">EVENT_LOG</Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{e.description}</p>
                    {e.metadata && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(e.metadata).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center animate-pulse">
              <Clock size={32} className="text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Timeline Synchronized</p>
          </div>
        )}
      </div>
    </div>
  )
}
