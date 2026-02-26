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

        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        
        // High-performance drawing: Use a fixed number of bars
        const barCount = 48
        const step = Math.floor(bufferLength / barCount)
        const barWidth = (WIDTH / barCount) * 0.8
        const gap = (WIDTH / barCount) * 0.2
        
        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step
          const value = dataArray[dataIndex]
          const barHeight = (value / 255) * HEIGHT * 0.8
          
          // Emerald gradient effect
          const opacity = 0.4 + (value / 255) * 0.6
          ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`
          
          // Draw rounded bars (simulated with rect for speed)
          const x = i * (barWidth + gap)
          const y = (HEIGHT - barHeight) / 2
          ctx.fillRect(x, y, barWidth, barHeight)
        }
      } else {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        ctx.beginPath()
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 2
        const t = Date.now() / 1000
        for (let x = 0; x < WIDTH; x++) {
          const y = HEIGHT / 2 + Math.sin((x / WIDTH) * 4 * Math.PI + t) * 4
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
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="relative w-full max-w-2xl group">
        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={160} 
          className="relative rounded-3xl border border-slate-100 bg-white/50 backdrop-blur-sm w-full shadow-inner" 
        />
      </div>

      <div className="flex flex-col items-center gap-4 relative">
        <button
          onClick={onToggle}
          disabled={isProcessing}
          className={`group relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 scale-100 active:scale-95 shadow-2xl ${
            isProcessing 
              ? 'bg-slate-100 cursor-wait' 
              : isRecording 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {isRecording && (
            <div className="absolute inset-0">
              <span className="absolute inset-[-12px] rounded-full bg-rose-500/20 animate-ping duration-[2000ms]" />
              <span className="absolute inset-[-24px] rounded-full bg-rose-500/10 animate-ping duration-[3000ms]" />
            </div>
          )}
          
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 border-white/20 transition-all duration-500 ${isRecording ? 'bg-rose-400/20' : 'bg-indigo-500/20'}`}>
            {isProcessing ? (
              <svg className="w-10 h-10 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isRecording ? (
              <svg className="w-10 h-10 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white fill-current drop-shadow-sm" viewBox="0 0 24 24">
                <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v6a2 2 0 004 0V5a2 2 0 00-2-2zm-1 14.93V20H9v2h6v-2h-2v-2.07A8.001 8.001 0 0120 11h-2a6 6 0 01-12 0H4a8.001 8.001 0 007 7.93z" />
              </svg>
            )}
          </div>
        </button>

        <div className="flex flex-col items-center gap-1">
          <p className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isRecording ? 'text-rose-600' : 'text-slate-600'}`}>
            {isProcessing ? 'TRANScribing...' : isRecording ? 'RECORDING LIVE' : 'TAP TO SPEAK'}
          </p>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.2em]">
            {isProcessing ? 'Please wait a moment' : isRecording ? 'Click to stop session' : 'Voice Assistant Ready'}
          </p>
        </div>
      </div>
    </div>
  )
}
