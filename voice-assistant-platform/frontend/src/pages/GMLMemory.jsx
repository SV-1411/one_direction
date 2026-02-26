import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { gmlAPI } from '../api/client'
import EntityCard from '../components/gml/EntityCard'
import EntityGraph from '../components/gml/EntityGraph'
import GMLTestConsole from '../components/gml/GMLTestConsole'
import MemoryTimeline from '../components/gml/MemoryTimeline'
<<<<<<< HEAD

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#64748b']
=======
import Button from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Page, PageHeader, PageSubTitle, PageTitle } from '../components/ui/Page'
import Badge from '../components/ui/Badge'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b']
>>>>>>> backup-new-ui

export default function GMLMemory() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [events, setEvents] = useState([])
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [entityDetail, setEntityDetail] = useState(null)

  const loadAll = async () => {
<<<<<<< HEAD
    const [st, gr, ev] = await Promise.all([gmlAPI.getStats(), gmlAPI.getGraph(), gmlAPI.getTimeline(50)])
    setStats(st.data)
    setGraph(gr.data)
    setEvents(ev.data.events || [])
  }

  useEffect(() => {
    loadAll().catch(() => {})
  }, [])

  const typeData = useMemo(() => Object.entries(stats?.entity_types || {}).map(([name, value]) => ({ name, value })), [stats])
=======
    try {
      const [st, gr, ev] = await Promise.all([
        gmlAPI.getStats(), 
        gmlAPI.getGraph(), 
        gmlAPI.getTimeline(50)
      ])
      setStats(st.data)
      setGraph(gr.data)
      setEvents(ev.data.events || [])
    } catch (error) {
      console.error('Failed to load GML data', error)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const typeData = useMemo(() => 
    Object.entries(stats?.entity_types || {}).map(([name, value]) => ({ name, value })), 
    [stats]
  )

>>>>>>> backup-new-ui
  const healthPct = useMemo(() => {
    if (!graph.nodes.length) return 0
    const healthy = graph.nodes.filter((n) => (n.confidence || 0) >= 0.7).length
    return Math.round((healthy / graph.nodes.length) * 100)
  }, [graph.nodes])

  const onNodeClick = async (node) => {
    setSelectedEntity(node)
<<<<<<< HEAD
    const detail = await gmlAPI.getEntity(node.id)
    setEntityDetail(detail.data)
=======
    try {
      const detail = await gmlAPI.getEntity(node.id)
      setEntityDetail(detail.data)
    } catch (error) {
      console.error('Failed to load entity detail', error)
    }
>>>>>>> backup-new-ui
  }

  const onSearchTimeline = async (q) => {
    if (!q) return loadAll()
<<<<<<< HEAD
    const res = await gmlAPI.searchEvents(q)
    setEvents(res.data.results || [])
  }

  const forgetEntity = async (id) => {
    await gmlAPI.forgetEntity(id)
    await loadAll()
    setEntityDetail(null)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">{['overview', 'graph', 'timeline', 'console'].map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded border ${tab === t ? 'bg-blue-600 text-white' : 'bg-white'}`}>{t}</button>)}</div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white rounded border p-3">Active Entities: <b>{stats?.active_entities ?? 0}</b></div>
            <div className="bg-white rounded border p-3">Relationships: <b>{stats?.active_relationships ?? 0}</b></div>
            <div className="bg-white rounded border p-3">Events: <b>{stats?.total_events ?? 0}</b></div>
            <div className="bg-white rounded border p-3">Forgotten: <b>{stats?.forgotten_entities ?? 0}</b></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded border p-3 h-72"><h3 className="font-semibold mb-2">Entity Type Breakdown</h3><ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={typeData} dataKey="value" nameKey="name" outerRadius={90} label>{typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            <div className="bg-white rounded border p-3"><h3 className="font-semibold mb-2">Memory Health</h3><div className="w-full bg-gray-200 rounded-full h-4"><div className="h-4 bg-green-500 rounded-full" style={{ width: `${healthPct}%` }} /></div><p className="text-sm mt-2">{healthPct}% entities above 0.7 confidence</p><h4 className="font-medium mt-4 mb-2">Recent events</h4><ul className="text-sm space-y-1">{events.slice(0,5).map((e) => <li key={e.event_id || e._id}>• {e.description}</li>)}</ul></div>
          </div>
        </div>
      )}

      {tab === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><EntityGraph nodes={graph.nodes} edges={graph.edges} onNodeClick={onNodeClick} /></div>
          <div>{entityDetail ? <EntityCard entity={entityDetail.entity} relationships={entityDetail.relationships} events={entityDetail.events} onForget={forgetEntity} /> : <div className="bg-white border rounded p-3 text-sm text-gray-500">Click a node to inspect entity details.</div>}</div>
        </div>
      )}

      {tab === 'timeline' && <MemoryTimeline events={events} onSearch={onSearchTimeline} />}
      {tab === 'console' && <GMLTestConsole />}
    </div>
=======
    try {
      const res = await gmlAPI.searchEvents(q)
      setEvents(res.data.results || [])
    } catch (error) {
      console.error('Failed to search timeline', error)
    }
  }

  const forgetEntity = async (id) => {
    if (!confirm('Are you sure you want to forget this entity?')) return
    try {
      await gmlAPI.forgetEntity(id)
      await loadAll()
      setEntityDetail(null)
    } catch (error) {
      console.error('Failed to forget entity', error)
    }
  }

  return (
    <Page className="max-w-7xl">
      <PageHeader className="mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-600">Cognitive Fabric</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight text-slate-900">Memory Layer (GML)</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Deep entity graph and persistent cognitive context architecture.</PageSubTitle>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-fit mb-8 border border-slate-200/50">
        {['overview', 'graph', 'timeline', 'console'].map((t) => (
          <Button 
            key={t} 
            onClick={() => setTab(t)} 
            variant={tab === t ? 'primary' : 'ghost'} 
            size="sm"
            className={`rounded-xl px-6 transition-all duration-300 ${tab === t ? 'shadow-lg shadow-emerald-200' : 'text-slate-500 hover:text-emerald-600'}`}
          >
            <span className="capitalize font-bold tracking-tight">{t}</span>
          </Button>
        ))}
      </div>

      <div className="mt-2">
        {tab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Active Entities', value: stats?.active_entities ?? 0, icon: '👤' },
                { label: 'Relationships', value: stats?.active_relationships ?? 0, icon: '🔗' },
                { label: 'Total Events', value: stats?.total_events ?? 0, icon: '📝' },
                { label: 'Forgotten', value: stats?.forgotten_entities ?? 0, icon: '🗑️' },
              ].map((s, i) => (
                <Card key={i} className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
                      <span className="text-lg opacity-50 group-hover:scale-110 transition-transform">{s.icon}</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-emerald-600">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="h-[450px] border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="px-8 pt-8 border-none">
                  <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Entity Ontology</CardTitle>
                  <CardDescription className="font-medium text-slate-400 italic">Distribution of cognitive classifications</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={typeData} 
                        dataKey="value" 
                        nameKey="name" 
                        innerRadius={70}
                        outerRadius={110} 
                        paddingAngle={10}
                        stroke="none"
                      >
                        {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="px-8 pt-8 border-none">
                  <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Graph Persistence</CardTitle>
                  <CardDescription className="font-medium text-slate-400 italic">Integrity and recent recall events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-10">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Confidence Threshold</span>
                      <span className="text-2xl font-black text-emerald-600 tracking-tighter">{healthPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                        style={{ width: `${healthPct}%` }} 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cognitive Timeline
                    </h4>
                    <div className="space-y-4">
                      {events.slice(0, 4).map((e, i) => (
                        <div key={e.event_id || e._id} className="flex gap-4 group animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-white group-hover:bg-emerald-500 transition-colors" />
                            {i < 3 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                          </div>
                          <span className="text-sm text-slate-600 font-medium leading-relaxed pb-2">{e.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
            <Card className="lg:col-span-2 h-[600px] overflow-hidden border-none shadow-2xl shadow-emerald-900/5 bg-white/80 backdrop-blur-xl rounded-[2.5rem]">
              <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-100/50 bg-slate-50/30">
                <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Entity Graph Visualization</CardTitle>
                <Badge variant="info" className="bg-emerald-50 text-emerald-600 border-emerald-100 px-4 py-1 text-[10px] font-black uppercase tracking-widest">Interactive</Badge>
              </CardHeader>
              <CardContent className="p-0 h-[calc(600px-88px)]">
                <EntityGraph nodes={graph.nodes} edges={graph.edges} onNodeClick={onNodeClick} />
              </CardContent>
            </Card>
            <div className="space-y-6">
              {entityDetail ? (
                <EntityCard 
                  entity={entityDetail.entity} 
                  relationships={entityDetail.relationships} 
                  events={entityDetail.events} 
                  onForget={forgetEntity} 
                />
              ) : (
                <Card className="border-none shadow-xl bg-white/70 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                  <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Persistence Inspector</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center px-8">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 animate-pulse">
                      <span className="text-3xl opacity-50">🔍</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Select a cognitive node in the graph visualization to inspect its persistent properties and neural connections.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div className="animate-in fade-in duration-700">
            <MemoryTimeline events={events} onSearch={onSearchTimeline} />
          </div>
        )}
        
        {tab === 'console' && (
          <div className="animate-in fade-in duration-700 max-w-6xl mx-auto">
            <GMLTestConsole />
          </div>
        )}
      </div>
    </Page>
>>>>>>> backup-new-ui
  )
}
