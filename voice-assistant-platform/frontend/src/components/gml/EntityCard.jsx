<<<<<<< HEAD
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
=======
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

export default function EntityCard({ entity, relationships, events, onForget }) {
  if (!entity) return null

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="overflow-hidden border-indigo-100 shadow-indigo-100/50">
        <CardHeader className="bg-indigo-50/30 border-b border-indigo-100/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge variant="info" className="uppercase tracking-wider text-[10px]">{entity.type}</Badge>
              <CardTitle className="text-xl text-indigo-900">{entity.name}</CardTitle>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-indigo-100 text-2xl">
              {entity.type === 'person' ? '�' : entity.type === 'organization' ? '🏢' : '📦'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Confidence</p>
                <p className="text-sm font-mono font-bold text-slate-700">{Math.round((entity.confidence || 0) * 100)}%</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Weight</p>
                <p className="text-sm font-mono font-bold text-slate-700">{(entity.weight || 0).toFixed(2)}</p>
              </div>
            </div>
            
            {entity.metadata && Object.keys(entity.metadata).length > 0 && (
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Properties</p>
                <div className="space-y-2">
                  {Object.entries(entity.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-slate-900">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {relationships?.length > 0 && (
        <Card className="border-slate-100">
          <CardHeader className="py-3 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-xs uppercase tracking-widest text-slate-500 font-bold">Connections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {relationships.map((rel, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">
                      {rel.type}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{rel.target_name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{(rel.weight || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button 
        variant="danger" 
        size="sm" 
        onClick={() => onForget(entity.id)}
        className="w-full h-11"
      >
        Forget this Entity
      </Button>
>>>>>>> backup-new-ui
    </div>
  )
}
