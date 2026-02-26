import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import Button from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import Input from '../components/ui/Input'

export default function Login() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password || form.password.length < 3) {
      setError('Username and password are required (password min 3 chars).')
      return
    }
    try {
      setError('')
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#ecfdf5_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#f0fdf4_0%,transparent_50%)]" />
      <form onSubmit={submit} className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        <Card className="border-none shadow-2xl shadow-emerald-900/10 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="px-10 pt-10 pb-6 border-none text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-600 shadow-lg shadow-emerald-200 text-white mx-auto mb-6 animate-float">
              <Mic size={32} strokeWidth={2.5} />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2 italic">Access your neural voice interface</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity Reference</label>
                <Input 
                  value={form.username} 
                  onChange={(e) => setForm({ ...form, username: e.target.value })} 
                  placeholder="Enter username" 
                  required 
                  className="h-12 rounded-2xl border-slate-100 bg-white/50 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Access Protocol</label>
                <Input 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="••••••••" 
                  required 
                  className="h-12 rounded-2xl border-slate-100 bg-white/50 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-bold text-rose-600 text-center">{error}</p>
                </div>
              )}

              <Button 
                disabled={isLoading} 
                type="submit" 
                className="w-full h-14 rounded-2xl text-base font-black tracking-widest shadow-xl shadow-emerald-200/50 active:scale-[0.98] transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AUTHENTICATING...
                  </div>
                ) : 'ESTABLISH_SESSION'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Engine v4.2.0 • Secured</p>
      </form>
    </div>
  )
}
