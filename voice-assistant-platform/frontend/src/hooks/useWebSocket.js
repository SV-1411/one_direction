import { useCallback, useRef, useState } from 'react'

export default function useWebSocket() {
  const wsRef = useRef(null)
  const queueRef = useRef([])
  const reconnectRef = useRef({ attempts: 0, sessionId: null, token: null })
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionState, setConnectionState] = useState('idle')

  const connect = useCallback((sessionId, accessToken) => {
    reconnectRef.current.sessionId = sessionId
    reconnectRef.current.token = accessToken
    const url = `ws://localhost:8000/ws/audio/${sessionId}?token=${accessToken || ''}`
    setConnectionState('connecting')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionState('open')
      reconnectRef.current.attempts = 0
      while (queueRef.current.length) ws.send(JSON.stringify(queueRef.current.shift()))
    }

    ws.onmessage = (event) => {
      try {
        setLastMessage(JSON.parse(event.data))
      } catch {
        setLastMessage({ type: 'error', message: 'Invalid message payload' })
      }
    }

    ws.onclose = () => {
      if (reconnectRef.current.attempts < 3) {
        const delay = 500 * 2 ** reconnectRef.current.attempts
        reconnectRef.current.attempts += 1
        setConnectionState('reconnecting')
        setTimeout(() => connect(reconnectRef.current.sessionId, reconnectRef.current.token), delay)
      } else {
        setConnectionState('closed')
      }
    }

    ws.onerror = () => {
      setConnectionState('error')
      ws.close()
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
