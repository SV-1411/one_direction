import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SessionVolumeChart({ data = [] }) {
  const normalized = data.map((d) => ({ ...d, day: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }) }))
  return (
    <div className="h-72 rounded border bg-white p-3">
      <h3 className="mb-2 font-semibold">Session Volume (7d)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={normalized}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="web" stackId="a" fill="#3b82f6" />
          <Bar dataKey="whatsapp" stackId="a" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
