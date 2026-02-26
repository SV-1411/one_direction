import AudioPlayer from '../components/AudioPlayer'
import EmotionPanel from '../components/EmotionPanel'
import FraudRiskMeter from '../components/FraudRiskMeter'
import SentimentBadge from '../components/SentimentBadge'
import TranscriptPanel from '../components/TranscriptPanel'
import UrgencyIndicator from '../components/UrgencyIndicator'
import VoiceRecorder from '../components/VoiceRecorder'
import useVoiceSession from '../hooks/useVoiceSession'

export default function VoiceSession() {
  const { sessionId, isRecording, transcript, response, analysis, audioUrl, isProcessing, error, analyserNode, startRecording, stopRecording, stopSession } = useVoiceSession()

  return (
    <div className="space-y-4 p-4">
      <div className="rounded border bg-white p-3 flex justify-between">
        <div>Session: <span className="font-mono">{sessionId || '-'}</span></div>
        <div>Status: {isProcessing ? 'Processing' : isRecording ? 'Recording' : sessionId ? 'Active' : 'Idle'}</div>
      </div>

      {analysis?.escalation_required ? <div className="rounded bg-red-100 border border-red-300 p-3 text-red-700 font-semibold">🚨 Escalation Required</div> : null}
      {error ? <div className="rounded bg-red-50 border border-red-300 p-2 text-red-700">{error}</div> : null}

      <VoiceRecorder isRecording={isRecording} isProcessing={isProcessing} analyserNode={analyserNode} onToggle={isRecording ? stopRecording : startRecording} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TranscriptPanel title="Your Speech" text={transcript} />
        <TranscriptPanel title="AI Response" text={response} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="rounded border bg-white p-3"><h4 className="mb-2 text-sm font-semibold">Sentiment</h4><SentimentBadge sentiment={analysis?.sentiment || 'neutral'} score={analysis?.sentiment_score} /></div>
        <div className="rounded border bg-white p-3"><UrgencyIndicator value={analysis?.urgency_score || 0} /></div>
        <FraudRiskMeter score={analysis?.fraud_risk || 0} />
        <div className="rounded border bg-white p-3"><h4 className="mb-2 text-sm font-semibold">Escalation</h4><div>{analysis?.escalation_required ? '🔔 Triggered' : '✅ Normal'}</div></div>
        <EmotionPanel emotion={analysis?.emotion} />
      </div>

      {analysis?.memory_context && (
        <div className="mt-4 bg-slate-800/50 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><span className="text-blue-400">🧠</span><p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Memory Context Used</p></div>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">{analysis.memory_context}</pre>
        </div>
      )}

      <AudioPlayer src={audioUrl} />
      {sessionId ? <button onClick={stopSession} className="rounded bg-slate-800 px-4 py-2 text-white">End Session</button> : null}
    </div>
  )
}
