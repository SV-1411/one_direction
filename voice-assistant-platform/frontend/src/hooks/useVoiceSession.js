import { useEffect, useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { voiceAPI } from '../api/client'
import { useAuthStore } from '../store/authStore'
import useWebSocket from './useWebSocket'

function b64ToBlob(base64, type = 'audio/wav') {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
  return new Blob([new Uint8Array(byteNumbers)], { type })
}

export default function useVoiceSession() {
  const [sessionId, setSessionId] = useState(null)
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState('')
  const [analyserNode, setAnalyserNode] = useState(null)
  const [recordingBytes, setRecordingBytes] = useState(0)
  const [recordingChunks, setRecordingChunks] = useState(0)
  const [recordingStartedAt, setRecordingStartedAt] = useState(null)
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0)
  const [backendBytes, setBackendBytes] = useState(0)
  const [backendChunks, setBackendChunks] = useState(0)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const wsHook = useWebSocket()
  const token = useAuthStore((s) => s.accessToken)

  useEffect(() => setIsConnected(wsHook.connectionState === 'open'), [wsHook.connectionState])

  const startSession = async () => {
    const { data } = await voiceAPI.startSession('web')
    setSessionId(data.session_id)
    wsHook.connect(data.session_id, token)
    return data.session_id
  }

    const startRecording = async () => {
    try {
      const sid = sessionId || (await startSession())
      setTranscript('')
      setResponse('')
      setAudioUrl('')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      })

      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      setAnalyserNode(analyser)

      // Use ScriptProcessor or AudioWorklet to get raw PCM
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      source.connect(processor)
      processor.connect(audioContext.destination)

      // Reset recording proof metrics
      setRecordingBytes(0)
      setRecordingChunks(0)
      setBackendBytes(0)
      setBackendChunks(0)
      const startedAt = Date.now()
      setRecordingStartedAt(startedAt)
      setRecordingElapsedMs(0)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = setInterval(() => {
        setRecordingElapsedMs(Date.now() - startedAt)
      }, 200)

      processor.onaudioprocess = (e) => {
        // console.log('onaudioprocess', isRecording);
        const inputData = e.inputBuffer.getChannelData(0)
        // Convert float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF
        }
        
        const buffer = pcmData.buffer
        setRecordingBytes((prev) => prev + buffer.byteLength)
        setRecordingChunks((prev) => prev + 1)

        // ALWAYS SEND if ws is open, don't rely on isRecording state which might lag
        if (wsHook.connectionState === 'open') {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
          wsHook.sendMessage({ type: 'audio_chunk', data: base64 })
        }
      }

      mediaRecorderRef.current = {
        stop: () => {
          processor.disconnect()
          source.disconnect()
          audioContext.close()
        },
        stream: stream
      }

      setIsRecording(true)
      setError('')
    } catch (err) {
      setError(`Microphone access denied: ${err.message}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    wsHook.sendMessage({ type: 'end_stream' })
    setIsRecording(false)
    setIsProcessing(true)
  }

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }, [])

  const stopSession = async () => {
    if (!sessionId) return
    await voiceAPI.endSession(sessionId)
    wsHook.disconnect()
    setIsConnected(false)
  }

    useEffect(() => {
    if (!wsHook.lastMessage) return
    const msg = wsHook.lastMessage

    switch (msg.type) {
      case 'execute_actions':
        if (msg.actions && Array.isArray(msg.actions)) {
          msg.actions.forEach(action => {
            console.log('[action] executing', action)
            if (action.type === 'OPEN_URL') {
              window.open(action.value, '_blank')
            } else if (action.type === 'NAVIGATE') {
              navigate(action.value)
            }
          })
        }
        break
      case 'ingest_stats':
        if (typeof msg.bytes_received === 'number') setBackendBytes(msg.bytes_received)
        if (typeof msg.chunks_received === 'number') setBackendChunks(msg.chunks_received)
        break
      case 'transcript_chunk':
        setTranscript((prev) => (msg.final ? msg.text : `${prev} ...`))
        break
      case 'transcript_final':
        setTranscript(msg.text)
        if (msg.analysis) {
          console.log('Received Analysis:', msg.analysis);
          setAnalysis(msg.analysis)
        }
        break
      case 'response_chunk':
        setResponse((prev) => prev + msg.text)
        break
      case 'response_final':
        setResponse(msg.text)
        break
      case 'audio_chunk':
        audioChunksRef.current.push(msg.data)
        break
      case 'audio_complete': {
        setIsProcessing(false)
        const fullB64 = audioChunksRef.current.join('')
        audioChunksRef.current = []
        const audioBlob = b64ToBlob(fullB64, 'audio/mpeg')
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        if (msg.emotion) {
          setAnalysis(prev => ({ ...prev, emotion: msg.emotion }))
        }
        break
      }
      case 'error':
        setError(msg.message)
        setIsProcessing(false)
        break
      default:
        break
    }
  }, [wsHook.lastMessage])

  return {
    sessionId,
    isRecording,
    isConnected,
    transcript,
    response,
    analysis,
    audioUrl,
    isProcessing,
    error,
    analyserNode,
    recordingBytes,
    recordingChunks,
    recordingStartedAt,
    recordingElapsedMs,
    backendBytes,
    backendChunks,
    startSession,
    startRecording,
    stopRecording,
    stopSession,
  }
}
