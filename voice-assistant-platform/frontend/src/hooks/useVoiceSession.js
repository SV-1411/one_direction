import { useEffect, useRef, useState } from 'react'
import useWebSocket from './useWebSocket'

export default function useVoiceSession(sessionId){
  const [recording,setRecording]=useState(false)
  const [stream,setStream]=useState(null)
  const mediaRecorder=useRef(null)
  const ws = useWebSocket(sessionId ? `${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/audio/${sessionId}`:null)

  useEffect(()=>{ if(!recording) return; navigator.mediaDevices.getUserMedia({audio:true}).then((s)=>{setStream(s); const rec=new MediaRecorder(s); mediaRecorder.current=rec; rec.ondataavailable=async (e)=>{ const arr=await e.data.arrayBuffer(); const b64=btoa(String.fromCharCode(...new Uint8Array(arr))); ws.send({type:'audio_chunk',data:b64}) }; rec.start(1500) }) },[recording])
  const stop=()=>{mediaRecorder.current?.stop(); stream?.getTracks().forEach(t=>t.stop()); ws.send({type:'end_stream'}); setRecording(false)}
  return { recording, setRecording, stop, messages: ws.messages }
}
