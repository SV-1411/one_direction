import { useState } from 'react'
import client from '../api/client'
import useVoiceSession from '../hooks/useVoiceSession'
import VoiceRecorder from '../components/VoiceRecorder'
import TranscriptPanel from '../components/TranscriptPanel'
import SentimentBadge from '../components/SentimentBadge'
import FraudRiskMeter from '../components/FraudRiskMeter'
import UrgencyIndicator from '../components/UrgencyIndicator'

export default function VoiceSession(){
  const [sid,setSid]=useState(null)
  const [analysis,setAnalysis]=useState({})
  const {recording,setRecording,stop,messages}=useVoiceSession(sid)
  const transcript = messages.filter(m=>m.type?.includes('transcript')).map(m=>m.text)
  const start = async()=>{ const {data}=await client.post('/api/voice/start-session',{channel:'web'}); setSid(data.session_id); setRecording(true) }
  return <div><h2>Voice Session</h2>{analysis.escalation_required && <div style={{background:'red',color:'#fff'}}>Escalation Required</div>}<VoiceRecorder recording={recording} onStart={start} onStop={stop}/><TranscriptPanel items={transcript}/><SentimentBadge sentiment={analysis.sentiment||'neutral'}/><UrgencyIndicator value={analysis.urgency_score||0}/><FraudRiskMeter value={analysis.fraud_risk||0}/></div>
}
