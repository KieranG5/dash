'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Newspaper, RefreshCw, Search, ExternalLink } from 'lucide-react'
import { ALL_SYMBOLS } from '@/lib/mockData'

type Sentiment = 'all' | 'positive' | 'neutral' | 'negative'

type NewsItem = {
  id: string
  headline: string
  source: string
  url: string
  symbols: string[]
  publishedAt: number
  ageMinutes: number
  sentiment: Exclude<Sentiment, 'all'>
  sentimentScore: number
  relevance: number
  image: string | null
}

type NewsSummary = {
  count: number
  sentimentCounts: {
    positive: number
    neutral: number
    negative: number
  }
  averageSentiment: number
}

interface NewsPanelProps {
  symbol?: string
}

function timeAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function sentimentLabel(sentiment: NewsItem['sentiment']) {
  if (sentiment === 'positive') return 'Bullish'
  if (sentiment === 'negative') return 'Bearish'
  return 'Neutral'
}

function sentimentClass(sentiment: NewsItem['sentiment']) {
  if (sentiment === 'positive') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  if (sentiment === 'negative') return 'text-red-400 bg-red-400/10 border-red-400/20'
  return 'text-slate-400 bg-slate-400/10 border-slate-600/40'
}

export default function NewsPanel({ symbol = 'AAPL' }: NewsPanelProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol)
  const [query, setQuery] = useState('')
  const [news, setNews] = useState<NewsItem[]>([])
  const [summary, setSummary] = useState<NewsSummary | null>(null)
  const [sentiment, setSentiment] = useState<Sentiment>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    setSelectedSymbol(symbol)
  }, [symbol])

  const load = useCallback(async (options?: { quiet?: boolean; search?: string }) => {
    if (!options?.quiet) setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ symbol: selectedSymbol })
      const search = options?.search ?? query
      if (search.trim()) params.set('q', search.trim())

      const response = await fetch(`/api/news?${params.toString()}`, { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? 'News request failed')

      setNews(json.news ?? [])
      setSummary(json.summary ?? null)
      setLastUpdated(json.timestamp ?? Date.now())
    } catch {
      setNews([])
      setSummary(null)
      setError('Live news is unavailable right now. Try refreshing again in a minute.')
    } finally {
      setLoading(false)
    }
  }, [query, selectedSymbol])

  useEffect(() => {
    void load({ quiet: true })
  }, [load])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load({ quiet: true })
      }
    }, 5 * 60_000)
    return () => clearInterval(interval)
  }, [load])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void load({ search: query })
  }

  const filtered = useMemo(() => {
    if (sentiment === 'all') return news
    return news.filter(item => item.sentiment === sentiment)
  }, [news, sentiment])

  const mood = summary
    ? summary.averageSentiment > 0.15 ? 'Bullish tilt' : summary.averageSentiment < -0.15 ? 'Bearish tilt' : 'Mixed mood'
    : 'Loading mood'

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col gap-4 mb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Newspaper className="w-4 h-4 text-sky-400" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-white">Live News & Sentiment</h2>
              <span className="text-[10px] uppercase tracking-wide text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                Yahoo Finance
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {mood} for <span className="font-mono text-sky-300">{selectedSymbol}</span>
              {lastUpdated ? ` - updated ${new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedSymbol}
            onChange={event => setSelectedSymbol(event.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
          >
            {ALL_SYMBOLS.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <form onSubmit={submit} className="flex min-w-0 items-center rounded-lg border border-slate-700 bg-slate-950/60 focus-within:border-sky-500">
            <Search className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search market news"
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-slate-600"
            />
            <button type="submit" className="mr-1 rounded bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-500">
              Search
            </button>
          </form>
          <button
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-all hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
          <MiniStat label="Stories" value={summary.count.toString()} color="text-white" />
          <MiniStat label="Bullish" value={summary.sentimentCounts.positive.toString()} color="text-emerald-400" />
          <MiniStat label="Neutral" value={summary.sentimentCounts.neutral.toString()} color="text-slate-300" />
          <MiniStat label="Bearish" value={summary.sentimentCounts.negative.toString()} color="text-red-400" />
        </div>
      )}

      <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(['all', 'positive', 'neutral', 'negative'] as Sentiment[]).map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setSentiment(value)}
            className={`flex-shrink-0 rounded px-2.5 py-1 text-xs capitalize transition-colors ${
              sentiment === value ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {value === 'positive' ? 'bullish' : value === 'negative' ? 'bearish' : value}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-[32rem] overflow-y-auto scrollbar-hide">
        {loading && news.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8 animate-pulse">Loading live market news...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">No stories match this filter yet.</p>
        )}
        {filtered.map(item => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block p-3 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all"
          >
            <div className="flex gap-3">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  className="hidden h-16 w-16 flex-shrink-0 rounded-lg object-cover sm:block"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-200 leading-snug">{item.headline}</p>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold border ${sentimentClass(item.sentiment)}`}>
                    {sentimentLabel(item.sentiment)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-slate-500">{item.source}</span>
                  <span className="text-slate-700">-</span>
                  <span className="text-xs text-slate-600">{timeAgo(item.ageMinutes)}</span>
                  <span className="text-slate-700">-</span>
                  <span className="text-xs text-slate-600">Relevance {item.relevance}%</span>
                  <span className="text-slate-700">-</span>
                  <span className="inline-flex items-center gap-1 text-xs text-sky-400">
                    Open <ExternalLink className="h-3 w-3" />
                  </span>
                  <div className="flex gap-1">
                    {item.symbols.slice(0, 4).map(ticker => (
                      <span key={ticker} className="text-xs text-sky-400 font-mono">{ticker}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-mono text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}
