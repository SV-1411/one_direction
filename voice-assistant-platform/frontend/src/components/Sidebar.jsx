import { AlertTriangle, BarChart3, Brain, LayoutDashboard, Mic, ScrollText, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

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
    <aside className="h-screen w-64 border-r bg-white p-4 hidden md:flex md:flex-col">
      <div className="mb-6 text-lg font-bold">Voice Assistant</div>
      <nav className="space-y-1">
        {links.map((l) => {
          const Icon = l.icon
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `flex items-center gap-2 rounded px-3 py-2 text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Icon size={16} />
              {l.label} {l.badge ? <span className="ml-auto rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">{l.badge}</span> : null}
            </NavLink>
          )
        })}
      </nav>
      <div className="mt-auto rounded border bg-gray-50 p-3 text-xs">
        <div>{user?.username || 'Guest'}</div>
        <div className="mt-1 inline-flex rounded bg-gray-200 px-2 py-0.5 uppercase">{user?.role || 'agent'}</div>
      </div>
    </aside>
  )
}
