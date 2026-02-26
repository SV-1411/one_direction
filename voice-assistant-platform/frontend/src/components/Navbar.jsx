import { Bell, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)

  const title = useMemo(() => location.pathname.replace('/', '') || 'dashboard', [location.pathname])

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div>
        <div className="text-sm text-gray-500">Home / {title}</div>
        <h1 className="text-lg font-semibold capitalize">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded p-2 hover:bg-gray-100">
          <Bell size={18} />
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">3</span>
        </button>
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm">
            {user?.username || 'User'} <ChevronDown size={14} />
          </button>
          {open ? (
            <div className="absolute right-0 mt-2 w-40 rounded border bg-white p-1 text-sm shadow">
              <Link to="/settings" className="block rounded px-2 py-1 hover:bg-gray-100">Settings</Link>
              <button onClick={logout} className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
