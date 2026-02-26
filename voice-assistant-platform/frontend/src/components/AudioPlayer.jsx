import { useEffect, useRef, useState } from 'react'

export default function AudioPlayer({ src }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    if (!src || !audioRef.current) return
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
  }, [src])

  const onTime = () => {
    if (!audioRef.current) return
    setCurrent(audioRef.current.currentTime)
    setDuration(audioRef.current.duration || 0)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
    setPlaying(!playing)
  }

  const seek = (e) => {
    if (!audioRef.current) return
    const pct = Number(e.target.value)
    audioRef.current.currentTime = (pct / 100) * (duration || 1)
  }

  if (!src) return null

  return (
    <div className="rounded border bg-white p-3">
      <audio ref={audioRef} src={src} onTimeUpdate={onTime} onLoadedMetadata={onTime} onEnded={() => setPlaying(false)} />
      <div className="flex items-center gap-3">
        <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
        <input type="range" min="0" max="100" value={duration ? (current / duration) * 100 : 0} onChange={seek} className="flex-1" />
        <span className="text-xs">{current.toFixed(1)} / {duration.toFixed(1)}s</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span>Volume</span>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v }} />
      </div>
    </div>
  )
}
