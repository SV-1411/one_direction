import { useEffect, useRef } from 'react'

export default function VoiceRecorder({ isRecording, isProcessing, analyserNode, onToggle }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const WIDTH = canvas.width
    const HEIGHT = canvas.height

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)

      if (analyserNode && isRecording) {
        const bufferLength = analyserNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserNode.getByteFrequencyData(dataArray)

        ctx.fillStyle = '#0f172a'
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        const barWidth = (WIDTH / bufferLength) * 2.5
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * HEIGHT
          const hue = (i / bufferLength) * 240 + 180
          ctx.fillStyle = `hsl(${hue}, 80%, 60%)`
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)
          x += barWidth + 1
        }
      } else {
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(0, 0, WIDTH, HEIGHT)
        ctx.beginPath()
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 2
        const t = Date.now() / 1000
        for (let x = 0; x < WIDTH; x++) {
          const y = HEIGHT / 2 + Math.sin((x / WIDTH) * 4 * Math.PI + t) * 8
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [analyserNode, isRecording])

  return (
    <div className="flex flex-col items-center gap-6">
      <canvas ref={canvasRef} width={600} height={120} className="rounded-xl border border-slate-700 w-full max-w-xl" />
      <button
        onClick={onToggle}
        disabled={isProcessing}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
          isProcessing ? 'bg-slate-600 cursor-wait' : isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/50'
        }`}
      >
        {isRecording && (
          <>
            <span className="absolute w-32 h-32 rounded-full bg-red-500/30 animate-ping" />
            <span className="absolute w-28 h-28 rounded-full bg-red-500/20 animate-ping" />
          </>
        )}
        {isProcessing ? (
          <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : isRecording ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v6a2 2 0 004 0V5a2 2 0 00-2-2zm-1 14.93V20H9v2h6v-2h-2v-2.07A8.001 8.001 0 0120 11h-2a6 6 0 01-12 0H4a8.001 8.001 0 007 7.93z" /></svg>
        )}
      </button>
      <p className="text-slate-400 text-sm">{isProcessing ? 'Processing your message...' : isRecording ? 'Recording — click to stop' : 'Click to start speaking'}</p>
    </div>
  )
}
