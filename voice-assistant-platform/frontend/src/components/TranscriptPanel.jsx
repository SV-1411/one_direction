<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from 'react'

export default function TranscriptPanel({ text = '', title = 'Transcript' }) {
  const [display, setDisplay] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    let i = 0
    const target = text || ''
    const timer = setInterval(() => {
      i += 3
      setDisplay(target.slice(0, i))
      if (i >= target.length) clearInterval(timer)
    }, 15)
    return () => clearInterval(timer)
  }, [text])

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [display])

  return (
    <div className="rounded border bg-white p-3">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div ref={ref} className="h-52 overflow-y-auto rounded bg-gray-50 p-3 text-sm whitespace-pre-wrap">
        {display || <span className="text-gray-400">Listening...</span>}
      </div>
    </div>
=======
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

export default function TranscriptPanel({ text = '', title = 'Transcript' }) {
  const [display, setDisplay] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    setDisplay(text || '')
  }, [text])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [display])

  return (
    <Card className="flex flex-col h-[350px] overflow-hidden border-none shadow-lg bg-white/50 backdrop-blur-sm">
      <CardHeader className="py-4 border-b border-slate-100/50 bg-slate-50/30">
        <CardTitle className="text-xs uppercase tracking-[0.15em] text-indigo-600 font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {display ? (
          <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">{display}</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <p className="text-sm font-medium italic">Waiting for interaction...</p>
          </div>
        )}
      </CardContent>
    </Card>
>>>>>>> backup-new-ui
  )
}
