import { useEffect, useMemo, useState } from 'react'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import client from '../api/client'

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899']

export default function EmotionAnalytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    client.get('/api/emotion/trends').then((r) => setData(r.data)).catch(() => {})
  }, [])

  const pieData = useMemo(() => {
    const d = data?.emotion_distribution || {}
    return Object.entries(d).map(([name, value]) => ({ name, value }))
  }, [data])

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border rounded p-3">Most common emotion: <b>{data?.most_common_emotion || '-'}</b></div>
        <div className="bg-white border rounded p-3">Avg stress score: <b>{data?.avg_stress_score ?? '-'}</b></div>
        <div className="bg-white border rounded p-3">Suggestions tracked: <b>{data?.common_suggestions?.length || 0}</b></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-3 h-80">
          <h3 className="font-semibold mb-2">Emotion Trend 7d</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data?.trend_7d || []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="stressed" stroke="#ef4444" />
              <Line type="monotone" dataKey="calm" stroke="#22c55e" />
              <Line type="monotone" dataKey="confident" stroke="#3b82f6" />
              <Line type="monotone" dataKey="nervous" stroke="#eab308" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border rounded p-3 h-80">
          <h3 className="font-semibold mb-2">Dominant Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border rounded p-3">
        <h3 className="font-semibold mb-2">Top Suggestions</h3>
        <ul className="list-disc ml-5 text-sm">{(data?.common_suggestions || []).map((s, i) => <li key={i}>{s.suggestion} ({s.count})</li>)}</ul>
      </div>
    </div>
  )
}
