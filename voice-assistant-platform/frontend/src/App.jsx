import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VoiceSession from './pages/VoiceSession'
import Analytics from './pages/Analytics'
import Transcripts from './pages/Transcripts'
import FraudAlerts from './pages/FraudAlerts'
import Settings from './pages/Settings'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

export default function App(){
  return <div style={{display:'flex'}}><Sidebar/><div style={{flex:1}}><Navbar/><Routes>
    <Route path='/login' element={<Login/>}/><Route path='/' element={<Dashboard/>}/><Route path='/voice' element={<VoiceSession/>}/><Route path='/analytics' element={<Analytics/>}/><Route path='/transcripts' element={<Transcripts/>}/><Route path='/fraud-alerts' element={<FraudAlerts/>}/><Route path='/settings' element={<Settings/>}/><Route path='*' element={<Navigate to='/'/>}/>
  </Routes></div></div>
}
