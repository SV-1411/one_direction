import { useCallback, useRef, useState } from 'react'

export default function useWebSocket() {
  const wsRef = useRef(null)
  const queueRef = useRef([])
  const reconnectRef = useRef({ attempts: 0, sessionId: null, token: null })
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionState, setConnectionState] = useState('idle')

    const connect = useCallback((sessionId, accessToken) => {
    if (!sessionId) return
    
    // Clear existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    reconnectRef.current.sessionId = sessionId
    reconnectRef.current.token = accessToken
    
    // CRITICAL: Force consistency between page origin and socket target.
    // Some browsers block WS if the host differs (localhost vs 127.0.0.1).
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const hostname = window.location.hostname
    const url = `${protocol}//${hostname}:8000/ws/audio/${sessionId}?token=${accessToken || ''}`
    
    setConnectionState('connecting')
    console.log(`[ws] connecting to ${url}`)
    
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnectionState('open')
        reconnectRef.current.attempts = 0
        console.log('[ws] open', { url })
        while (queueRef.current.length) {
          const msg = queueRef.current.shift()
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg))
          }
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          if (data?.type === 'ping') {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'pong' }))
          }
        } catch (err) {
          console.error('[ws] parse error', err)
          setLastMessage({ type: 'error', message: 'Invalid message payload' })
        }
      }

      ws.onclose = (event) => {
        console.log('[ws] close', { 
          url, 
          code: event.code, 
          reason: event.reason, 
          wasClean: event.wasClean 
        })
        
        if (reconnectRef.current.attempts < 3) {
          const delay = 500 * 2 ** reconnectRef.current.attempts
          reconnectRef.current.attempts += 1
          setConnectionState('reconnecting')
          setTimeout(() => connect(reconnectRef.current.sessionId, reconnectRef.current.token), delay)
        } else {
          setConnectionState('closed')
        }
      }

      ws.onerror = (event) => {
        console.error('[ws] error', { url, event })
        setConnectionState('error')
      }
    } catch (err) {
      console.error('[ws] setup error', err)
      setConnectionState('error')
    }
  }, [])

  const sendMessage = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg))
    else queueRef.current.push(msg)
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    setConnectionState('closed')
  }, [])

  return { sendMessage, lastMessage, connectionState, connect, disconnect }
}
