import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export default function MemoryTimeline({ events = [], onSearch }) {
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch(search)} placeholder="Search events semantically..." className="flex-1 bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        <button onClick={() => onSearch(search)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded text-sm">🔍</button>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={event.event_id || i} className="flex gap-4 pl-10 relative">
              <div className="absolute left-3 top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
              <div className="flex-1 bg-slate-800 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-200 text-sm">{event.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500">{event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : 'unknown time'}</span>
                  {event.participants?.length > 0 && <div className="flex gap-1">{event.participants.slice(0, 3).map((p, j) => <span key={j} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{p}</span>)}</div>}
                  {event._similarity && <span className="text-xs text-green-400 ml-auto">{Math.round(event._similarity * 100)}% match</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {events.length === 0 && <p className="text-slate-500 text-center py-8">No events recorded yet</p>}
      </div>
    </div>
  )
}
