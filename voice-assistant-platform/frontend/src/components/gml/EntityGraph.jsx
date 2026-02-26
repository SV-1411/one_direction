import { useEffect, useRef, useState } from 'react'

export default function EntityGraph({ nodes = [], edges = [], onNodeClick }) {
  const svgRef = useRef(null)
  const [positions, setPositions] = useState({})
  const [selectedNode, setSelectedNode] = useState(null)

  const TYPE_COLORS = { person: '#3b82f6', place: '#22c55e', concept: '#f59e0b', organization: '#a855f7', object: '#64748b' }

  useEffect(() => {
    const initialPositions = {}
    nodes.forEach((node, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * 2 * Math.PI
      const radius = 180
      initialPositions[node.id] = { x: 300 + radius * Math.cos(angle) + (Math.random() - 0.5) * 80, y: 250 + radius * Math.sin(angle) + (Math.random() - 0.5) * 80 }
    })
    setPositions(initialPositions)
  }, [nodes])

  const nodeSize = (node) => Math.max(12, Math.min(30, 8 + (node.mention_count || 1) * 2))

  return (
    <div className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <svg ref={svgRef} width="100%" viewBox="0 0 600 500" className="cursor-grab active:cursor-grabbing">
        {edges.map((edge) => {
          const s = positions[edge.source]
          const t = positions[edge.target]
          if (!s || !t) return null
          return (
            <g key={edge.id}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#334155" strokeWidth={Math.max(1, (edge.strength || 0.2) * 4)} strokeOpacity={0.7} />
              <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 4} textAnchor="middle" fontSize="9" fill="#64748b">{edge.label}</text>
            </g>
          )
        })}
        {nodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null
          const r = nodeSize(node)
          const color = TYPE_COLORS[node.type] || '#64748b'
          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`} onClick={() => { setSelectedNode(node); onNodeClick?.(node) }} className="cursor-pointer">
              <circle r={r} fill={color} fillOpacity={selectedNode?.id === node.id ? 1 : 0.7} stroke={selectedNode?.id === node.id ? 'white' : color} strokeWidth={selectedNode?.id === node.id ? 2 : 0} />
              <text y={r + 12} textAnchor="middle" fontSize="10" fill="white" className="select-none">{node.label}</text>
              <circle r={r + 3} fill="none" stroke={color} strokeWidth="1" strokeOpacity={node.confidence || 0.5} strokeDasharray={`${(node.confidence || 0.5) * 2 * Math.PI * (r + 3)} ${2 * Math.PI * (r + 3)}`} />
            </g>
          )
        })}
      </svg>

      <div className="absolute top-3 right-3 bg-slate-800/90 rounded-lg p-3 text-xs space-y-1">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: color }} /><span className="text-slate-300 capitalize">{type}</span></div>
        ))}
      </div>

      {nodes.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-slate-500">No memory graph yet — ingest some conversations to see entities appear</div>}
    </div>
  )
}
