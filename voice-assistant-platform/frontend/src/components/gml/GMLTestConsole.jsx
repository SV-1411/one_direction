import { useState } from 'react'
import client from '../../api/client'

export default function GMLTestConsole() {
  const [ingestText, setIngestText] = useState('I met a girl today at the coffee shop.')
  const [ingestSessionId, setIngestSessionId] = useState('test-session-1')
  const [ingestResult, setIngestResult] = useState(null)
  const [ingestLoading, setIngestLoading] = useState(false)

  const [question, setQuestion] = useState('Which girl did I like?')
  const [queryResult, setQueryResult] = useState(null)
  const [queryLoading, setQueryLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchType, setSearchType] = useState('entities')

  const [decayLoading, setDecayLoading] = useState(false)
  const [decayResult, setDecayResult] = useState(null)

  const handleIngest = async () => {
    setIngestLoading(true)
    try {
      const { data } = await client.post('/api/gml/ingest', { text: ingestText, session_id: ingestSessionId })
      setIngestResult(data)
    } catch (e) {
      setIngestResult({ error: e.message })
    } finally {
      setIngestLoading(false)
    }
  }

  const handleQuery = async () => {
    setQueryLoading(true)
    try {
      const { data } = await client.post('/api/gml/query', { question })
      setQueryResult(data)
    } catch (e) {
      setQueryResult({ error: e.message })
    } finally {
      setQueryLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      const endpoint = searchType === 'entities' ? `/api/gml/entities/search?q=${encodeURIComponent(searchQuery)}` : `/api/gml/events/search?q=${encodeURIComponent(searchQuery)}`
      const { data } = await client.get(endpoint)
      setSearchResults(data)
    } catch (e) {
      setSearchResults({ error: e.message })
    }
  }

  const handleDecay = async () => {
    setDecayLoading(true)
    try {
      const { data } = await client.post('/api/gml/decay/run')
      setDecayResult(data)
    } catch (e) {
      setDecayResult({ error: e.message })
    } finally {
      setDecayLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-6 font-mono text-sm">
      <div className="flex items-center gap-2"><span className="text-2xl">🧠</span><h2 className="text-white text-lg font-bold">GML Test Console</h2><span className="ml-auto text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">LIVE</span></div>

      <div className="space-y-3 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 uppercase text-xs tracking-wider">1. Ingest Memory</p>
        <textarea value={ingestText} onChange={(e) => setIngestText(e.target.value)} rows={3} className="w-full bg-slate-800 text-green-400 border border-slate-600 rounded p-2 resize-none focus:outline-none focus:border-blue-500" placeholder="Enter text to memorize..." />
        <div className="flex gap-2">
          <input value={ingestSessionId} onChange={(e) => setIngestSessionId(e.target.value)} className="flex-1 bg-slate-800 text-slate-300 border border-slate-600 rounded px-2 py-1 text-xs" placeholder="Session ID (e.g. day1)" />
          <button onClick={handleIngest} disabled={ingestLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-xs font-bold disabled:opacity-50">{ingestLoading ? '⏳ Ingesting...' : '▶ Ingest'}</button>
        </div>
        {ingestResult && !ingestResult.error && <div className="bg-slate-800 rounded p-3 space-y-1"><p className="text-green-400">✅ {ingestResult.entities_created} entities, {ingestResult.relationships_created} relationships, {ingestResult.events_created} events</p>{ingestResult.details?.entities?.map((e, i) => <p key={i} className="text-slate-300 pl-2">→ Entity: <span className="text-yellow-400">{e.name}</span> ({e.type})</p>)}</div>}
        {ingestResult?.error && <p className="text-red-400">❌ {ingestResult.error}</p>}
      </div>

      <div className="space-y-3 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 uppercase text-xs tracking-wider">2. Ask Memory Question</p>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full bg-slate-800 text-green-400 border border-slate-600 rounded p-2 focus:outline-none focus:border-blue-500" placeholder="Ask a question about what you remember..." />
        <button onClick={handleQuery} disabled={queryLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded text-xs font-bold disabled:opacity-50">{queryLoading ? '⏳ Querying...' : '🔍 Ask Memory'}</button>
        {queryResult && !queryResult.error && <div className="bg-slate-800 rounded p-3 space-y-2"><p className="text-white">{queryResult.answer}</p><p className="text-slate-400 text-xs">Confidence: {Math.round((queryResult.confidence || 0) * 100)}%</p></div>}
        {queryResult?.error && <p className="text-red-400">❌ {queryResult.error}</p>}
      </div>

      <div className="space-y-3 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 uppercase text-xs tracking-wider">3. Semantic Search</p>
        <div className="flex gap-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-slate-800 text-green-400 border border-slate-600 rounded p-2 focus:outline-none focus:border-blue-500" placeholder="Search memories..." />
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="bg-slate-800 text-slate-300 border border-slate-600 rounded px-2"><option value="entities">Entities</option><option value="events">Events</option></select>
          <button onClick={handleSearch} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">🔍</button>
        </div>
        {searchResults && <div className="space-y-1">{(searchResults.results || searchResults.entities || []).map((item, i) => <div key={i} className="flex items-center justify-between bg-slate-800 rounded px-3 py-1.5"><span className="text-slate-200">{item.name || item.description}</span><div className="flex gap-2 text-xs">{item._similarity && <span className="text-green-400">{Math.round(item._similarity * 100)}% match</span>}<span className="text-slate-500">{item.type || 'event'}</span></div></div>)}</div>}
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-700">
        <button onClick={handleDecay} disabled={decayLoading} className="bg-orange-800 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50">{decayLoading ? '⏳ Running...' : '⚡ Run Decay Cycle'}</button>
        {decayResult && <span className="text-xs text-slate-400 my-auto">Decayed: {decayResult.entities_decayed}, Forgotten: {decayResult.entities_forgotten}</span>}
      </div>
    </div>
  )
}
