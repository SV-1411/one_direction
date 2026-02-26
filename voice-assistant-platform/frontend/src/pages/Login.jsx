import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="mb-1 text-2xl font-bold">AI Voice Assistant</h1>
        <p className="mb-4 text-sm text-gray-500">Sign in to continue</p>

        <label className="mb-2 block text-sm">Username</label>
        <input className="mb-3 w-full rounded border px-3 py-2" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />

        <label className="mb-2 block text-sm">Password</label>
        <input className="mb-2 w-full rounded border px-3 py-2" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

        {error ? <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}

        <button disabled={isLoading} className="w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-60">
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
