import { useEffect, useRef, useState } from 'react'
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
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState('')
  const [analyserNode, setAnalyserNode] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
      })

      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      setAnalyserNode(analyser)

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsHook.connectionState === 'open') {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1]
            wsHook.sendMessage({ type: 'audio_chunk', data: base64 })
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.start(250)
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
    wsHook.sendMessage({ type: 'end_stream' })
    setIsRecording(false)
    setIsProcessing(true)
  }

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
      case 'transcript_chunk':
        setTranscript((prev) => (msg.final ? msg.text : `${prev} ...`))
        break
      case 'transcript_final':
        setTranscript(msg.text)
        setAnalysis(msg.analysis)
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
        const audioBlob = b64ToBlob(fullB64, 'audio/wav')
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
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
    startSession,
    startRecording,
    stopRecording,
    stopSession,
  }
}
