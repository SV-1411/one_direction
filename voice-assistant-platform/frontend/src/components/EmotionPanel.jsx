import { useEffect, useState } from 'react'

const EMOTION_CONFIG = {
  stressed: { emoji: '😰', color: 'text-orange-400', bg: 'bg-orange-900/30', bar: 'bg-orange-500' },
  nervous: { emoji: '😟', color: 'text-yellow-400', bg: 'bg-yellow-900/30', bar: 'bg-yellow-500' },
  excited: { emoji: '🤩', color: 'text-pink-400', bg: 'bg-pink-900/30', bar: 'bg-pink-500' },
  confident: { emoji: '😎', color: 'text-blue-400', bg: 'bg-blue-900/30', bar: 'bg-blue-500' },
  calm: { emoji: '😌', color: 'text-green-400', bg: 'bg-green-900/30', bar: 'bg-green-500' },
  sad: { emoji: '😢', color: 'text-indigo-400', bg: 'bg-indigo-900/30', bar: 'bg-indigo-500' },
}

export default function EmotionPanel({ emotion }) {
  const [visible, setVisible] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)

  useEffect(() => {
    if (emotion?.dominant_emotion) {
      setVisible(true)
      setShowSuggestion(false)
      if (emotion.suggestion) setTimeout(() => setShowSuggestion(true), 800)
    }
  }, [emotion])

  if (!emotion || !visible) {
    return <div className="bg-slate-800 rounded-xl p-4 border border-slate-700"><p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Emotional State</p><p className="text-slate-500 text-sm">Awaiting voice input...</p></div>
  }

  const dominant = emotion.dominant_emotion
  const config = EMOTION_CONFIG[dominant] || EMOTION_CONFIG.calm
  const scores = emotion.emotion_scores || {}
  const features = emotion.audio_features || {}

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider">Emotional State</p>
      <div className={`flex items-center gap-3 rounded-lg p-3 ${config.bg}`}>
        <span className="text-3xl">{config.emoji}</span>
        <div>
          <p className={`text-lg font-bold capitalize ${config.color}`}>{dominant}</p>
          <p className="text-xs text-slate-400">{Math.round((emotion.dominant_score || 0) * 100)}% confidence</p>
        </div>
        {emotion.analysis_method === 'text_fallback' && <span className="ml-auto text-xs text-slate-500 italic">text mode</span>}
      </div>

      <div className="space-y-2">
        {Object.entries(scores)
          .sort(([, a], [, b]) => b - a)
          .map(([name, value]) => {
            const cfg = EMOTION_CONFIG[name] || {}
            return (
              <div key={name} className="flex items-center gap-2">
                <span className="text-sm w-5">{cfg.emoji}</span>
                <span className="text-xs text-slate-400 w-20 capitalize">{name}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-1.5"><div className={`h-1.5 rounded-full transition-all duration-500 ${cfg.bar || 'bg-slate-500'}`} style={{ width: `${(value || 0) * 100}%` }} /></div>
                <span className="text-xs text-slate-400 w-8 text-right">{Math.round((value || 0) * 100)}%</span>
              </div>
            )
          })}
      </div>

      {features.pitch_mean_hz > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/50 rounded p-2"><p className="text-slate-400">Pitch</p><p className="text-white font-mono">{features.pitch_mean_hz} Hz</p></div>
          <div className="bg-slate-700/50 rounded p-2"><p className="text-slate-400">Speech Rate</p><p className="text-white font-mono">{features.speech_rate_wpm} WPM</p></div>
          <div className="bg-slate-700/50 rounded p-2"><p className="text-slate-400">Pause Ratio</p><p className="text-white font-mono">{Math.round((features.pause_ratio || 0) * 100)}%</p></div>
          <div className="bg-slate-700/50 rounded p-2"><p className="text-slate-400">Energy</p><p className="text-white font-mono">{features.energy_rms?.toFixed?.(4) || features.energy_rms}</p></div>
        </div>
      )}

      {showSuggestion && emotion.suggestion && <div className="bg-slate-700 rounded-lg p-3 border-l-4 border-blue-500"><p className="text-xs text-blue-400 font-semibold mb-1">💡 AI Suggestion</p><p className="text-sm text-slate-200">{emotion.suggestion}</p></div>}
    </div>
  )
}
