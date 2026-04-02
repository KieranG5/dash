'use client'

import { useState, useEffect } from 'react'
import { Newspaper, RefreshCw } from 'lucide-react'

interface NewsItem {
  id: number
  headline: string
  source: string
  url: string
  symbols: string[]
  created_at: string
}

const MOCK_NEWS: NewsItem[] = [
  { id: 1, headline: 'Apple unveils new AI-powered chip beating benchmark records by 40%', source: 'Bloomberg', url: '#', symbols: ['AAPL'], created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
  { id: 2, headline: 'NVIDIA data center revenue surges 200% year-over-year amid AI infrastructure boom', source: 'Reuters', url: '#', symbols: ['NVDA'], created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString() },
  { id: 3, headline: 'BHP Group raises iron ore output guidance as Chinese demand recovers strongly', source: 'AFR', url: '#', symbols: ['BHP.AX', 'RIO.AX'], created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 4, headline: 'Federal Reserve signals two rate cuts likely in second half of 2025', source: 'WSJ', url: '#', symbols: ['SPY', 'ES1'], created_at: new Date(Date.now() - 1000 * 60 * 58).toISOString() },
  { id: 5, headline: 'RBA holds rates steady, signals cautious easing ahead amid inflation concerns', source: 'AFR', url: '#', symbols: ['CBA.AX', 'NAB.AX', '^AXJO'], created_at: new Date(Date.now() - 1000 * 60 * 72).toISOString() },
  { id: 6, headline: 'Tesla Cybertruck demand disappoints analysts, shares slide in premarket trading', source: 'CNBC', url: '#', symbols: ['TSLA'], created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: 7, headline: 'Toyota raises full-year profit forecast, hybrid sales surge in North America', source: 'Nikkei', url: '#', symbols: ['7203.T', '^N225'], created_at: new Date(Date.now() - 1000 * 60 * 105).toISOString() },
  { id: 8, headline: 'Amazon AWS reaches $100B annual revenue run rate as cloud growth accelerates', source: 'FT', url: '#', symbols: ['AMZN'], created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 9, headline: 'Alibaba restructuring gains momentum, Hong Kong shares rise on buyback announcement', source: 'SCMP', url: '#', symbols: ['9988.HK', '^HSI'], created_at: new Date(Date.now() - 1000 * 60 * 135).toISOString() },
  { id: 10, headline: 'Gold hits new all-time high as dollar weakens on jobs data miss', source: 'MarketWatch', url: '#', symbols: ['GC1'], created_at: new Date(Date.now() - 1000 * 60 * 145).toISOString() },
  { id: 11, headline: 'SoftBank Vision Fund posts record quarterly gain on AI portfolio rebound', source: 'Nikkei', url: '#', symbols: ['9984.T'], created_at: new Date(Date.now() - 1000 * 60 * 160).toISOString() },
  { id: 12, headline: 'Tencent gaming revenue beats estimates, WeChat MAU hits 1.4 billion users', source: 'SCMP', url: '#', symbols: ['0700.HK', '^HSI'], created_at: new Date(Date.now() - 1000 * 60 * 175).toISOString() },
  { id: 13, headline: 'Meta advertising revenue beats estimates, AI-driven targeting cited as key driver', source: 'Bloomberg', url: '#', symbols: ['META'], created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { id: 14, headline: 'CSL Limited receives FDA approval for new haemophilia treatment', source: 'AFR', url: '#', symbols: ['CSL.AX'], created_at: new Date(Date.now() - 1000 * 60 * 195).toISOString() },
  { id: 15, headline: 'Microsoft Copilot+ PCs drive enterprise software upgrade cycle ahead of expectations', source: 'Reuters', url: '#', symbols: ['MSFT'], created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString() },
  { id: 16, headline: 'Crude oil falls below $78 as OPEC+ considers output increase next quarter', source: 'Reuters', url: '#', symbols: ['CL1'], created_at: new Date(Date.now() - 1000 * 60 * 250).toISOString() },
  { id: 17, headline: 'Alphabet beats earnings estimates for third consecutive quarter, YouTube ads hit record', source: 'CNBC', url: '#', symbols: ['GOOGL'], created_at: new Date(Date.now() - 1000 * 60 * 290).toISOString() },
  { id: 18, headline: 'Wesfarmers Bunnings division records strongest sales growth in five years', source: 'AFR', url: '#', symbols: ['WES.AX', '^AXJO'], created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString() },
]

const POSITIVE = ['surges', 'beats', 'record', 'growth', 'accelerates', 'high', 'gains', 'upgrade', 'rises', 'hits', 'ahead']
const NEGATIVE = ['falls', 'slides', 'disappoints', 'miss', 'weakens', 'below', 'drops', 'decline', 'cut', 'loss', 'concern']

function getSentiment(headline: string): 'positive' | 'negative' | 'neutral' {
  const lower = headline.toLowerCase()
  const pos = POSITIVE.filter(w => lower.includes(w)).length
  const neg = NEGATIVE.filter(w => lower.includes(w)).length
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  function load() {
    setLoading(true)
    // Simulate async load with mock data
    setTimeout(() => {
      setNews(MOCK_NEWS)
      setLastUpdated(new Date().toISOString())
      setLoading(false)
    }, 300)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-white">News & Sentiment</h2>
          {lastUpdated && (
            <span className="text-xs text-slate-600">· {timeAgo(lastUpdated)}</span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh news"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
        {news.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8 animate-pulse">Loading news...</p>
        )}
        {news.map(item => {
          const sentiment = getSentiment(item.headline)
          return (
            <div key={item.id} className="p-3 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-200 leading-snug flex-1">{item.headline}</p>
                <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-bold border ${
                  sentiment === 'positive' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                  sentiment === 'negative' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  'text-slate-400 bg-slate-400/10 border-slate-600/40'
                }`}>
                  {sentiment === 'positive' ? '↑' : sentiment === 'negative' ? '↓' : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-slate-500">{item.source}</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-600">{timeAgo(item.created_at)}</span>
                <span className="text-slate-700">·</span>
                <div className="flex gap-1">
                  {item.symbols.slice(0, 3).map(s => (
                    <span key={s} className="text-xs text-sky-400 font-mono">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
