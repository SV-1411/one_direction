import { useEffect, useState } from 'react'
<<<<<<< HEAD
=======
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import Badge from './ui/Badge'
>>>>>>> backup-new-ui

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
<<<<<<< HEAD
    return <div className="bg-slate-800 rounded-xl p-4 border border-slate-700"><p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Emotional State</p><p className="text-slate-500 text-sm">Awaiting voice input...</p></div>
=======
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">Emotion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500">Awaiting voice input...</p>
          </div>
        </CardContent>
      </Card>
    )
>>>>>>> backup-new-ui
  }

  const dominant = emotion.dominant_emotion
  const config = EMOTION_CONFIG[dominant] || EMOTION_CONFIG.calm
  const scores = emotion.emotion_scores || {}
  const features = emotion.audio_features || {}

  return (
<<<<<<< HEAD
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
=======
    <Card className="overflow-hidden">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">Emotion Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="text-4xl mb-1 animate-bounce duration-1000">{config.emoji}</div>
          <div className="flex items-center gap-2">
            <Badge variant={dominant === 'stressed' ? 'danger' : dominant === 'calm' ? 'success' : 'info'} className="capitalize px-3 py-1">
              {dominant}
            </Badge>
            <span className="text-xs font-mono font-bold text-slate-400">
              {Math.round((emotion.dominant_score || 0) * 100)}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => {
              const cfg = EMOTION_CONFIG[name] || {}
              return (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-500 flex items-center gap-1">
                      <span>{cfg.emoji}</span>
                      <span>{name}</span>
                    </span>
                    <span className="text-slate-400">{Math.round((value || 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${cfg.bar || 'bg-slate-500'}`}
                      style={{ width: `${(value || 0) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>

        {features.pitch_mean_hz > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-2 text-center border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pitch</p>
              <p className="text-xs font-mono font-bold text-slate-700">{Math.round(features.pitch_mean_hz)}Hz</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 text-center border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Speed</p>
              <p className="text-xs font-mono font-bold text-slate-700">{Math.round(features.speech_rate_wpm)} WPM</p>
            </div>
          </div>
        )}

        {showSuggestion && emotion.suggestion && (
          <div className="mt-6 animate-in slide-in-from-top-2 duration-500">
            <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Suggestion</span>
              </div>
              <p className="text-sm text-indigo-900 leading-relaxed font-medium">{emotion.suggestion}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
>>>>>>> backup-new-ui
  )
}
