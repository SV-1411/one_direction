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
    </div>
  )
}
