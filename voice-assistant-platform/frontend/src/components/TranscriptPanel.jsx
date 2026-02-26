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
  )
}
