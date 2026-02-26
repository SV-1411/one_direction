import { useEffect, useRef, useState } from 'react'

export default function useWebSocket(url){
  const wsRef = useRef(null)
  const [messages,setMessages]=useState([])
  useEffect(()=>{ if(!url) return; const ws = new WebSocket(url); wsRef.current=ws; ws.onmessage=(e)=>setMessages((m)=>[...m, JSON.parse(e.data)]); return ()=>ws.close(); },[url])
  return {messages, send:(data)=>wsRef.current?.send(JSON.stringify(data))}
}
