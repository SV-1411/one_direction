import { AlertTriangle, BarChart3, Brain, LayoutDashboard, Mic, ScrollText, Settings, Activity } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Badge from './ui/Badge'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/voice', label: 'Voice Session', icon: Mic },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/transcripts', label: 'Transcripts', icon: ScrollText },
  { to: '/fraud-alerts', label: 'Fraud Alerts', icon: AlertTriangle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/emotion', label: 'Emotion Analytics', icon: Brain },
  { to: '/gml', label: 'Memory (GML)', icon: Brain, badge: 'NEW' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  return (
    <aside className="h-screen w-72 shrink-0 border-r border-emerald-100 bg-white/80 backdrop-blur-xl px-4 py-8 hidden md:flex md:flex-col sticky top-0 z-40">
      <div className="mb-10 px-4 flex items-center gap-3 group cursor-default">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200 text-white transition-transform duration-500 group-hover:rotate-12">
          <Mic size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold leading-none text-slate-900 tracking-tight">Voice AI</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 mt-1.5">Premium Platform</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-2">
        <div className="px-4 mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Main Menu</div>
        {links.map((l) => {
          const Icon = l.icon
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 translate-x-1'
                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                }`
              }
            >
              <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110`} />
              <span className="flex-1 truncate">{l.label}</span>
              {l.badge ? (
                <Badge className={({ isActive }) => isActive ? 'bg-white/20 text-white border-transparent' : ''} variant="success">
                  {l.badge}
                </Badge>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-emerald-50 px-2">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-white shadow-inner">
            {(user?.username || 'G')[0].toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-white truncate">{user?.username || 'Guest'}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">{user?.role || 'Agent'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
