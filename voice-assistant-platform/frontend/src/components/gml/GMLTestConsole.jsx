import { useState } from 'react'
<<<<<<< HEAD
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
=======
import { gmlAPI } from '../../api/client'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import Badge from '../ui/Badge'
import Select from '../ui/Select'

export default function GMLTestConsole() {
  const [query, setQuery] = useState('')
  const [question, setQuestion] = useState('')
  const [ingestText, setIngestText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('entities')
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [decayLoading, setDecayLoading] = useState(false)

  const onRecall = async () => {
    setLoading(true)
    try {
      const res = await gmlAPI.recall(query)
      setResults({ type: 'Recall (Context)', data: res.data })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const onQuery = async () => {
    setLoading(true)
    try {
      const res = await gmlAPI.query(question)
      setResults({ type: 'Cognitive Query', data: res.data })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const onIngest = async () => {
    setLoading(true)
    try {
      await gmlAPI.ingest(ingestText)
      setResults({ type: 'Ingestion', data: { status: 'Success', message: 'Text processed and entities extracted.' } })
      setIngestText('')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const onSearch = async () => {
    setLoading(true)
    try {
      const res = searchType === 'entities' 
        ? await gmlAPI.searchEntities(searchQuery)
        : await gmlAPI.searchEvents(searchQuery)
      setResults({ type: `Search (${searchType})`, data: res.data })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const onRunDecay = async () => {
    setDecayLoading(true)
    try {
      const res = await gmlAPI.runDecay()
      setResults({ type: 'Decay Cycle', data: res.data })
    } catch (e) { console.error(e) }
    setDecayLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 pb-12">
      <div className="space-y-6">
        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Semantic Recall</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">Test how the AI retrieves relevant context from the long-term memory graph based on semantic similarity.</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter search query..." 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                className="bg-white"
              />
              <Button onClick={onRecall} disabled={loading || !query} size="sm">Recall</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Cognitive Query</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">Ask questions directly to the memory layer to see how it reasons about stored entities and relationships.</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Ask a question..." 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-white"
              />
              <Button onClick={onQuery} disabled={loading || !question} size="sm">Query</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Search & Ingestion</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Memories</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white"
                />
                <Select 
                  value={searchType} 
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-32"
                >
                  <option value="entities">Entities</option>
                  <option value="events">Events</option>
                </Select>
                <Button onClick={onSearch} disabled={loading || !searchQuery} size="sm">Search</Button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manual Ingestion</p>
              <textarea 
                className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Paste text here..."
                value={ingestText}
                onChange={(e) => setIngestText(e.target.value)}
              />
              <Button onClick={onIngest} disabled={loading || !ingestText} className="w-full h-11">Process & Ingest</Button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                onClick={onRunDecay} 
                disabled={decayLoading} 
                className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                {decayLoading ? 'Running Decay...' : '⚡ Trigger Decay Cycle'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-full min-h-[500px]">
        <Card className="h-full border-none shadow-xl bg-slate-900 overflow-hidden flex flex-col">
          <CardHeader className="border-b border-slate-800 bg-slate-900/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-xs uppercase tracking-widest text-slate-400 font-bold">Response Console</CardTitle>
            </div>
            {results && <Badge variant="info" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400">{results.type}</Badge>}
          </CardHeader>
          <CardContent className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Processing Layer...</p>
              </div>
            ) : results ? (
              <div className="animate-in fade-in duration-500">
                <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                <div className="text-4xl">⌨️</div>
                <p className="text-sm font-medium text-slate-500 italic">Execute a command to see<br/>live cognitive processing results.</p>
              </div>
            )}
          </CardContent>
        </Card>
>>>>>>> backup-new-ui
      </div>
    </div>
  )
}
