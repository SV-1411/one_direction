import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function SentimentTrendChart({ data = [] }) {
  const normalized = data.map((d) => ({ ...d, day: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }) }))
  return (
    <div className="h-72 rounded border bg-white p-3">
      <h3 className="mb-2 font-semibold">Sentiment Trend (7d)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={normalized}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis domain={[0, 1]} />
          <Tooltip formatter={(v) => `${Math.round(v * 100)}%`} />
          <Legend />
          <Line type="monotone" dataKey="positive" stroke="#16a34a" strokeWidth={2} />
          <Line type="monotone" dataKey="neutral" stroke="#6b7280" strokeWidth={2} />
          <Line type="monotone" dataKey="negative" stroke="#dc2626" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
