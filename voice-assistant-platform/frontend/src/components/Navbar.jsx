import { Bell, ChevronDown, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Button from './ui/Button'

export default function Navbar() {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)

  const title = useMemo(() => location.pathname.replace('/', '') || 'dashboard', [location.pathname])

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-emerald-100/50 bg-white/60 px-8 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600/60 mb-0.5">Platform Node</div>
          <h1 className="text-xl font-extrabold capitalize tracking-tight text-slate-900 drop-shadow-sm">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/50 transition-all duration-300 group" aria-label="Notifications">
          <Bell size={20} className="text-emerald-600 transition-transform group-hover:rotate-12" />
          <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
          </span>
        </Button>

        <div className="h-8 w-px bg-emerald-100 mx-1"></div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/50 p-1.5 pr-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-100/50 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 font-bold text-white shadow-md shadow-emerald-200 transition-transform group-hover:scale-105">
              {(user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex flex-col items-start text-left hidden lg:flex">
              <span className="text-xs font-bold text-slate-900 leading-none mb-1">{user?.username || 'User'}</span>
              <span className="text-[10px] font-bold text-emerald-600/70 leading-none uppercase tracking-wider">Active Account</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
              <div className="absolute right-0 mt-3 z-50 w-64 origin-top-right rounded-3xl border border-emerald-100 bg-white/90 p-2 shadow-2xl shadow-emerald-200/50 backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-emerald-50 mb-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Authenticated Session</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.email || user?.username || 'user@example.com'}</p>
                </div>
                <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-emerald-100 transition-colors">
                    <Settings size={16} />
                  </div>
                  Account Settings
                </Link>
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100/50 group-hover:bg-rose-100 transition-colors text-rose-600">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z"/></svg>
                  </div>
                  Secure Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
