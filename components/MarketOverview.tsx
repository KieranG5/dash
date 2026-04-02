'use client'

import { useState, useEffect, useCallback } from 'react'
import { extendedTickers, generateSparkline, type Ticker } from '@/lib/mockData'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface LiveQuote {
  symbol: string
  price: number
  change: number
  changePct: number
  volume: number
}

interface MarketOverviewProps {
  onSelectSymbol?: (symbol: string) => void
  selectedSymbol?: string
  onLiveStatus?: (live: boolean) => void
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v > 0 ? v.toString() : '—'
}

function formatPrice(price: number, currency: Ticker['currency']): string {
  if (currency === 'JPY') {
    return `¥${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  if (currency === 'AUD') {
    return `A$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (currency === 'HKD') {
    return `HK$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Returns true if the given market is currently open
function isMarketOpen(market: 'asx' | 'japan' | 'hk' | 'us'): boolean {
  const now = new Date()
  const getLocal = (tz: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: 'numeric',
      weekday: 'short', hour12: false,
    }).formatToParts(now)
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
    const weekday = get('weekday')
    const h = parseInt(get('hour'))
    const m = parseInt(get('minute'))
    const mins = h * 60 + m
    return { weekday, mins }
  }

  if (market === 'asx') {
    const { weekday, mins } = getLocal('Australia/Sydney')
    if (['Sat', 'Sun'].includes(weekday)) return false
    return mins >= 600 && mins < 960 // 10:00–16:00 AEST
  }
  if (market === 'japan') {
    const { weekday, mins } = getLocal('Asia/Tokyo')
    if (['Sat', 'Sun'].includes(weekday)) return false
    const morning = mins >= 540 && mins < 690  // 9:00–11:30
    const afternoon = mins >= 750 && mins < 930 // 12:30–15:30
    return morning || afternoon
  }
  if (market === 'hk') {
    const { weekday, mins } = getLocal('Asia/Hong_Kong')
    if (['Sat', 'Sun'].includes(weekday)) return false
    const morning = mins >= 570 && mins < 720  // 9:30–12:00
    const afternoon = mins >= 780 && mins < 960 // 13:00–16:00
    return morning || afternoon
  }
  if (market === 'us') {
    const { weekday, mins } = getLocal('America/New_York')
    if (['Sat', 'Sun'].includes(weekday)) return false
    return mins >= 570 && mins < 960 // 9:30–16:00
  }
  return false
}

function MarketStatusBadge({ market }: { market: 'asx' | 'japan' | 'hk' | 'us' }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(isMarketOpen(market))
    const t = setInterval(() => setOpen(isMarketOpen(market)), 60_000)
    return () => clearInterval(t)
  }, [market])

  return open ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Open
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Closed
    </span>
  )
}

function SectionHeader({ label, market }: { label: string; market: 'asx' | 'japan' | 'hk' | 'us' }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</p>
      <MarketStatusBadge market={market} />
    </div>
  )
}

export default function MarketOverview({ onSelectSymbol, selectedSymbol, onLiveStatus }: MarketOverviewProps) {
  const [tickerList, setTickerList] = useState<Ticker[]>(extendedTickers)
  const [isLive, setIsLive] = useState<boolean | null>(null)
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({})

  useEffect(() => {
    const sp: Record<string, number[]> = {}
    for (const t of extendedTickers) {
      sp[t.symbol] = generateSparkline(t.price)
    }
    setSparklines(sp)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes', { cache: 'no-store' })
      if (!res.ok) throw new Error('bad response')
      const json = await res.json()
      const quotes: LiveQuote[] = json.quotes ?? []

      if (quotes.length > 0) {
        setIsLive(true)
        onLiveStatus?.(true)
        setTickerList(prev => prev.map(t => {
          const q = quotes.find(q => q.symbol === t.symbol)
          if (!q || q.price === 0) return t
          return { ...t, price: q.price, change: q.change, changePct: q.changePct, volume: formatVolume(q.volume) }
        }))

        for (const sym of extendedTickers.map(t => t.symbol)) {
          fetch(`/api/history/${sym}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(d => { if (d.sparkline?.length > 0) setSparklines(prev => ({ ...prev, [sym]: d.sparkline })) })
            .catch(() => {})
        }
      } else {
        setIsLive(false)
        onLiveStatus?.(false)
      }
    } catch {
      setIsLive(false)
      onLiveStatus?.(false)
    }
  }, [onLiveStatus])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  const usEquities  = tickerList.filter(t => t.region === 'us' && t.type === 'equity')
  const usFutures   = tickerList.filter(t => t.region === 'us' && t.type === 'futures')
  const asxStocks   = tickerList.filter(t => t.region === 'asx')
  const japanStocks = tickerList.filter(t => t.region === 'japan')
  const hkStocks    = tickerList.filter(t => t.region === 'hk')

  const card = (t: Ticker) => (
    <TickerCard
      key={t.symbol}
      ticker={t}
      sparkline={sparklines[t.symbol] ?? []}
      selected={selectedSymbol === t.symbol}
      onClick={() => onSelectSymbol?.(t.symbol)}
    />
  )

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white">Market Overview</h2>
        {isLive === null && <span className="text-xs text-slate-500 animate-pulse">Connecting...</span>}
        {isLive === true && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
          </span>
        )}
        {isLive === false && (
          <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> Offline · Simulated
          </span>
        )}
      </div>

      {/* US Equities */}
      <div className="mb-5">
        <SectionHeader label="US Equities" market="us" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{usEquities.map(card)}</div>
      </div>

      {/* ASX */}
      <div className="mb-5">
        <SectionHeader label="ASX — Australia" market="asx" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{asxStocks.map(card)}</div>
      </div>

      {/* Asian Markets */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Asian Markets</p>
        </div>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-600">Japan (TSE)</span>
            <MarketStatusBadge market="japan" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{japanStocks.map(card)}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-600">Hong Kong (HKEX)</span>
            <MarketStatusBadge market="hk" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{hkStocks.map(card)}</div>
        </div>
      </div>

      {/* CME Futures */}
      <div>
        <SectionHeader label="CME Futures" market="us" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{usFutures.map(card)}</div>
      </div>
    </section>
  )
}

function TickerCard({ ticker, sparkline, selected, onClick }: {
  ticker: Ticker; sparkline: number[]; selected: boolean; onClick: () => void
}) {
  const pos = ticker.changePct > 0
  const neg = ticker.changePct < 0
  const Icon = pos ? TrendingUp : neg ? TrendingDown : Minus
  const sparkData = sparkline.map((v, i) => ({ i, v }))
  const strokeColor = pos ? '#34d399' : neg ? '#f87171' : '#64748b'

  return (
    <button
      onClick={onClick}
      className={`bg-[#0d1221] border rounded-xl p-3 text-left transition-all w-full hover:scale-[1.02] active:scale-[0.98] ${
        selected ? 'border-blue-500 ring-1 ring-blue-500/30'
        : pos ? 'border-emerald-800/60 hover:border-emerald-700'
        : neg ? 'border-red-800/60 hover:border-red-700'
        : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0">
          <p className="font-bold text-white text-xs">{ticker.symbol}</p>
          <p className="text-xs text-slate-500 truncate">{ticker.name}</p>
        </div>
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pos ? 'text-emerald-400' : neg ? 'text-red-400' : 'text-slate-500'}`} />
      </div>

      {sparkData.length > 0 && (
        <div className="h-7 my-1 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={strokeColor} dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-sm font-mono font-bold text-white">
        {formatPrice(ticker.price, ticker.currency)}
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <span className={`text-xs font-semibold ${pos ? 'text-emerald-400' : neg ? 'text-red-400' : 'text-slate-400'}`}>
          {pos ? '+' : ''}{ticker.changePct.toFixed(2)}%
        </span>
        <span className="text-xs text-slate-600">{ticker.volume}</span>
      </div>
    </button>
  )
}
