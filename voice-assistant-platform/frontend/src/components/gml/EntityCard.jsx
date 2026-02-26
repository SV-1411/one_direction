import { formatDistanceToNow } from 'date-fns'

export default function EntityCard({ entity, relationships = [], events = [], onForget }) {
  if (!entity) return null
  const TYPE_EMOJI = { person: '👤', place: '📍', concept: '💡', organization: '🏢', object: '📦' }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3"><span className="text-3xl">{TYPE_EMOJI[entity.type] || '❓'}</span><div><h3 className="text-white font-bold text-lg capitalize">{entity.name}</h3><p className="text-slate-400 text-xs capitalize">{entity.type}</p></div></div>
        <button onClick={() => onForget?.(entity.entity_id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-800 rounded">🗑️ Forget</button>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Memory Confidence</span><span>{Math.round((entity.confidence || 0) * 100)}%</span></div>
        <div className="w-full bg-slate-700 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${(entity.confidence || 0) * 100}%`, background: (entity.confidence || 0) > 0.6 ? '#22c55e' : (entity.confidence || 0) > 0.3 ? '#eab308' : '#ef4444' }} /></div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-700/50 rounded p-2"><p className="text-slate-400">Mentioned</p><p className="text-white font-bold">{entity.mention_count} times</p></div>
        <div className="bg-slate-700/50 rounded p-2"><p className="text-slate-400">Last seen</p><p className="text-white font-bold">{entity.last_seen ? formatDistanceToNow(new Date(entity.last_seen), { addSuffix: true }) : 'unknown'}</p></div>
      </div>

      {entity.aliases?.length > 0 && <div><p className="text-xs text-slate-400 mb-1">Also known as</p><div className="flex flex-wrap gap-1">{entity.aliases.map((a, i) => <span key={i} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{a}</span>)}</div></div>}

      {relationships.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Relationships ({relationships.length})</p>
          <div className="space-y-1">{relationships.slice(0, 5).map((rel, i) => <div key={i} className="flex items-center gap-2 text-xs bg-slate-700/50 rounded px-2 py-1"><span className="text-blue-400 font-medium">{rel.predicate}</span><span className="text-slate-400">→</span><span className="text-slate-300">{rel.object_entity_id}</span><span className="ml-auto text-slate-500">{Math.round((rel.strength || 0) * 100)}%</span></div>)}</div>
        </div>
      )}
    </div>
  )
}
