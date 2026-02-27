import AudioPlayer from '../components/AudioPlayer'
import EmotionPanel from '../components/EmotionPanel'
import FraudRiskMeter from '../components/FraudRiskMeter'
import SentimentBadge from '../components/SentimentBadge'
import TranscriptPanel from '../components/TranscriptPanel'
import UrgencyIndicator from '../components/UrgencyIndicator'
import VoiceRecorder from '../components/VoiceRecorder'
import useVoiceSession from '../hooks/useVoiceSession'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Page, PageActions, PageHeader, PageSubTitle, PageTitle } from '../components/ui/Page'
import { Activity, Brain } from 'lucide-react'

export default function VoiceSession() {
  const {
    sessionId,
    isRecording,
    transcript,
    response,
    analysis,
    audioUrl,
    isProcessing,
    error,
    analyserNode,
    recordingBytes,
    recordingChunks,
    recordingElapsedMs,
    backendBytes,
    backendChunks,
    startRecording,
    stopRecording,
    stopSession,
  } = useVoiceSession()

  return (
    <Page className="max-w-5xl">
      <PageHeader className="mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-glow" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-emerald-600">Neural Interface</span>
          </div>
          <PageTitle className="text-4xl font-black tracking-tight">Voice Session</PageTitle>
          <PageSubTitle className="text-slate-500 font-medium italic">Communicate with AI via low-latency cognitive voice stream.</PageSubTitle>
        </div>
        <PageActions>
          {sessionId ? (
            <Button variant="danger" onClick={stopSession} className="rounded-2xl px-6 shadow-xl shadow-rose-200/50">End Session</Button>
          ) : null}
        </PageActions>
      </PageHeader>

      <div className="grid grid-cols-1 gap-8">
        {/* Connection Status Glass */}
        <div className="glass rounded-3xl p-1 shadow-2xl shadow-emerald-900/5 overflow-hidden">
          <div className="bg-white/40 backdrop-blur-xl rounded-[1.4rem] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-white/50">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${sessionId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Stream ID:</span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">{sessionId || 'NO_ACTIVE_STREAM'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isProcessing ? 'warning' : isRecording ? 'danger' : sessionId ? 'success' : 'default'} className="px-4 py-1 text-[10px] font-black uppercase tracking-tighter">
                {isProcessing ? '⚡ Analyzing...' : isRecording ? '🎙️ Recording' : sessionId ? '✅ Ready' : 'IDLE'}
              </Badge>

              {sessionId && (
                <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] font-bold text-slate-600 bg-white/60 border border-white/60 px-3 py-1 rounded-xl">
                  <span className="text-slate-400">server bytes</span>
                  <span>{(backendBytes || 0).toLocaleString()}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400">chunks</span>
                  <span>{(backendChunks || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-4 backdrop-blur-sm flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-rose-500 text-white flex items-center justify-center">⚠️</div>
              <p className="text-sm font-bold text-rose-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interaction Area */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-2xl shadow-emerald-900/5 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-10">
                <VoiceRecorder
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  analyserNode={analyserNode}
                  onToggle={isRecording ? stopRecording : startRecording}
                  recordingBytes={recordingBytes}
                  recordingChunks={recordingChunks}
                  recordingElapsedMs={recordingElapsedMs}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TranscriptPanel title="Detected Utterance" text={transcript} />
              <TranscriptPanel title="Synthesized Response" text={response} />
            </div>
          </div>

          {/* Real-time Metrics Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Analysis</span>
              </div>
              
              <SentimentBadge sentiment={analysis?.sentiment || 'neutral'} score={analysis?.sentiment_score} />
              <UrgencyIndicator value={analysis?.urgency_score || 0} />
              <FraudRiskMeter score={analysis?.fraud_risk || 0} />
              
              <Card className="border-none shadow-xl shadow-emerald-900/5 bg-white/70 rounded-3xl overflow-hidden">
                <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Protocol Escalation</CardTitle>
                </CardHeader>
                <CardContent className="py-6 flex items-center justify-center">
                  {analysis?.escalation_required ? (
                    <div className="flex flex-col items-center gap-2 animate-bounce">
                      <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-200">🔔</div>
                      <span className="text-xs font-black text-rose-600 uppercase tracking-tighter">Action Required</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">✅</div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Normal Flow</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <EmotionPanel emotion={analysis?.emotion} />
            </div>
          </div>
        </div>

        {/* Cognitive Context Layer */}
        {analysis?.memory_context && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Card className="border-none shadow-2xl bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardHeader className="px-8 pt-8 pb-4 border-none bg-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 animate-pulse-subtle"><Brain size={20} /></div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight text-white uppercase italic">Cognitive Memory Context</CardTitle>
                    <CardDescription className="text-emerald-400/60 font-medium">Recalled from Long-Term Entity Graph (GML)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="rounded-2xl bg-slate-800/50 p-6 border border-white/5 shadow-inner">
                  <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">{analysis.memory_context}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Global Playback Controller */}
        <div className="sticky bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <AudioPlayer src={audioUrl} />
          </div>
        </div>
      </div>
    </Page>
  )
}
