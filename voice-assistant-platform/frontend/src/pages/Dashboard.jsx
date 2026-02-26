import React, { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Brain, Mic, ShieldAlert, Zap, BarChart3, Clock, Settings } from 'lucide-react'
import { Page, PageHeader, PageTitle, PageSubTitle, PageActions } from '../components/ui/Page'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { analyticsAPI } from '../api/client'
import SentimentTrendChart from '../components/charts/SentimentTrendChart'
import SessionVolumeChart from '../components/charts/SessionVolumeChart'
import UrgencyHeatmap from '../components/charts/UrgencyHeatmap'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await analyticsAPI.getDashboard()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Streams', value: stats?.total_sessions || 0, icon: <Mic className="text-emerald-500" />, trend: '+12%', color: 'emerald' },
    { label: 'Active Alerts', value: stats?.active_alerts || 0, icon: <AlertTriangle className="text-rose-500" />, trend: '-5%', color: 'rose' },
    { label: 'Cognitive Load', value: `${stats?.avg_urgency || 0}%`, icon: <Zap className="text-amber-500" />, trend: 'Stable', color: 'amber' },
    { label: 'Security Score', value: '98.2', icon: <ShieldAlert className="text-blue-500" />, trend: 'Optimal', color: 'blue' },
  ]

  return (
    <Page className="max-w-7xl">
      <PageHeader className="mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-600">Neural Command</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight text-slate-900">Intelligence Overview</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Real-time cognitive stream monitoring and heuristic analysis.</PageSubTitle>
        </div>
        <PageActions>
          <Button variant="primary" className="rounded-xl px-6 shadow-xl shadow-emerald-200/50">
            <Activity className="mr-2 h-4 w-4" /> Live Monitor
          </Button>
        </PageActions>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${s.color}-50 group-hover:bg-${s.color}-100 transition-colors`}>
                  {s.icon}
                </div>
                <Badge variant="outline" className={`text-[9px] font-black border-${s.color}-100 text-${s.color}-600 bg-${s.color}-50/50`}>{s.trend}</Badge>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
              <p className="text-3xl font-black tracking-tighter text-slate-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><BarChart3 size={18} /></div>
              <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Psychological Resonance</CardTitle>
            </div>
            <CardDescription className="font-medium text-slate-400">Heuristic sentiment trajectory across active streams</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            <div className="h-[350px]">
              <SentimentTrendChart />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Brain size={18} /></div>
              <CardTitle className="text-xl font-extrabold tracking-tight text-slate-900">Neural Load</CardTitle>
            </div>
            <CardDescription className="font-medium text-slate-400">Stream volume and cognitive processing</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            <div className="h-[350px]">
              <SessionVolumeChart />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/50 bg-slate-900 rounded-[2rem] overflow-hidden mt-10">
        <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><Clock size={18} /></div>
              <div>
                <CardTitle className="text-xl font-extrabold tracking-tight text-white">Urgency Mapping</CardTitle>
                <CardDescription className="text-emerald-400/60 font-medium">Spatiotemporal distribution of prioritized events</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="h-[400px] w-full bg-slate-800/50 rounded-2xl p-4">
            <UrgencyHeatmap data={stats?.urgency_heatmap || []} />
          </div>
        </CardContent>
      </Card>
    </Page>
  )
}
