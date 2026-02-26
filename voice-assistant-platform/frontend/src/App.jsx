import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import useAuth from './hooks/useAuth'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import EmotionAnalytics from './pages/EmotionAnalytics'
import FraudAlerts from './pages/FraudAlerts'
import GMLMemory from './pages/GMLMemory'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Transcripts from './pages/Transcripts'
import VoiceSession from './pages/VoiceSession'

function Protected({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50/50 selection:bg-emerald-100 selection:text-emerald-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Navbar />
        <div className="animate-in fade-in duration-700">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/voice" element={<VoiceSession />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/transcripts" element={<Transcripts />} />
            <Route path="/fraud-alerts" element={<FraudAlerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/emotion" element={<EmotionAnalytics />} />
            <Route path="/gml" element={<GMLMemory />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Protected><AppLayout /></Protected>} />
    </Routes>
  )
}
