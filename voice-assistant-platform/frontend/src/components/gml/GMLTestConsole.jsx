import { useState } from 'react'
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
      </div>
    </div>
  )
}
