import { useEffect, useMemo, useState } from 'react'
<<<<<<< HEAD
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import client from '../api/client'
=======
import { Activity, Brain, Clock, ShieldAlert, Zap, AlertTriangle } from 'lucide-react'
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import client from '../api/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Page, PageHeader, PageSubTitle, PageTitle } from '../components/ui/Page'
>>>>>>> backup-new-ui

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
<<<<<<< HEAD
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
=======
    <Page className="max-w-7xl">
      <PageHeader className="mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-600">Cognitive Insights</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight">Emotion Analytics</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Deep psychological tracking and emotional resonance mapping.</PageSubTitle>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2">Dominant Emotion</p>
            <b className="text-2xl font-black text-emerald-600 capitalize">{data?.most_common_emotion || '-'}</b>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2">Avg Stress Index</p>
            <b className="text-2xl font-black text-slate-900">{data?.avg_stress_score ?? '-'}</b>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-2">Coaching Signals</p>
            <b className="text-2xl font-black text-slate-900">{data?.common_suggestions?.length || 0}</b>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mt-10">
        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Activity size={18} /></div>
              <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Psychological Trends</CardTitle>
            </div>
            <CardDescription className="font-medium text-slate-400">7-day emotional state trajectory</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.trend_7d || []}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                  />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="stressed" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                  <Line type="monotone" dataKey="calm" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                  <Line type="monotone" dataKey="confident" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                  <Line type="monotone" dataKey="nervous" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Brain size={18} /></div>
              <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Emotion Core</CardTitle>
            </div>
            <CardDescription className="font-medium text-slate-400">Relative distribution of mapped emotions</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={8} stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-slate-900 rounded-[2rem] overflow-hidden mt-10 mb-12">
        <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 animate-pulse-subtle"><Brain size={20} /></div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-white uppercase italic">Interaction Coaching</CardTitle>
              <CardDescription className="text-emerald-400/60 font-medium">Algorithmic suggestions for improved engagement</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono text-[10px]">AI_COACH_V2</Badge>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.common_suggestions || []).map((s, i) => (
              <div key={i} className="group relative rounded-2xl bg-slate-800/50 p-5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 group-hover:scale-125 transition-transform" />
                  <div className="space-y-1">
                    <p className="text-sm text-slate-200 font-medium leading-relaxed">{s.suggestion}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frequency: {s.count} sessions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Page>
>>>>>>> backup-new-ui
  )
}
