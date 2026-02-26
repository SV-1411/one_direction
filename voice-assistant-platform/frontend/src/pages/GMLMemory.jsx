import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { gmlAPI } from '../api/client'
import EntityCard from '../components/gml/EntityCard'
import EntityGraph from '../components/gml/EntityGraph'
import GMLTestConsole from '../components/gml/GMLTestConsole'
import MemoryTimeline from '../components/gml/MemoryTimeline'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#64748b']

export default function GMLMemory() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [events, setEvents] = useState([])
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [entityDetail, setEntityDetail] = useState(null)

  const loadAll = async () => {
    const [st, gr, ev] = await Promise.all([gmlAPI.getStats(), gmlAPI.getGraph(), gmlAPI.getTimeline(50)])
    setStats(st.data)
    setGraph(gr.data)
    setEvents(ev.data.events || [])
  }

  useEffect(() => {
    loadAll().catch(() => {})
  }, [])

  const typeData = useMemo(() => Object.entries(stats?.entity_types || {}).map(([name, value]) => ({ name, value })), [stats])
  const healthPct = useMemo(() => {
    if (!graph.nodes.length) return 0
    const healthy = graph.nodes.filter((n) => (n.confidence || 0) >= 0.7).length
    return Math.round((healthy / graph.nodes.length) * 100)
  }, [graph.nodes])

  const onNodeClick = async (node) => {
    setSelectedEntity(node)
    const detail = await gmlAPI.getEntity(node.id)
    setEntityDetail(detail.data)
  }

  const onSearchTimeline = async (q) => {
    if (!q) return loadAll()
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
  )
}
