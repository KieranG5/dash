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
  return v.toString()
}

export default function MarketOverview({ onSelectSymbol, selectedSymbol, onLiveStatus }: MarketOverviewProps) {
  const [tickers, setTickers] = useState<Ticker[]>(extendedTickers)
  const [isLive, setIsLive] = useState<boolean | null>(null)
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({})

  // Generate fallback sparklines client-side only
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
        setTickers(prev => prev.map(t => {
          const q = quotes.find(q => q.symbol === t.symbol)
          if (!q || q.price === 0) return t
          return {
            ...t,
            price: q.price,
            change: q.change,
            changePct: q.changePct,
            volume: formatVolume(q.volume),
          }
        }))

        // Fetch sparklines from history API for each symbol
        for (const sym of extendedTickers.map(t => t.symbol)) {
          fetch(`/api/history/${sym}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(json => {
              if (json.sparkline?.length > 0) {
                setSparklines(prev => ({ ...prev, [sym]: json.sparkline }))
              }
            })
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

  const equities = tickers.filter(t => t.type === 'equity')
  const futures = tickers.filter(t => t.type === 'futures')

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-white">Market Overview</h2>
        {isLive === null && (
          <span className="text-xs text-slate-500 animate-pulse">Connecting...</span>
        )}
        {isLive === true && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </span>
        )}
        {isLive === false && (
          <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            Offline · Simulated
          </span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">Equities</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {equities.map(t => (
            <TickerCard
              key={t.symbol}
              ticker={t}
              sparkline={sparklines[t.symbol] ?? []}
              selected={selectedSymbol === t.symbol}
              onClick={() => onSelectSymbol?.(t.symbol)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-2">CME Futures</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {futures.map(t => (
            <TickerCard
              key={t.symbol}
              ticker={t}
              sparkline={sparklines[t.symbol] ?? []}
              selected={selectedSymbol === t.symbol}
              onClick={() => onSelectSymbol?.(t.symbol)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TickerCard({
  ticker, sparkline, selected, onClick,
}: {
  ticker: Ticker
  sparkline: number[]
  selected: boolean
  onClick: () => void
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
        selected
          ? 'border-blue-500 ring-1 ring-blue-500/30'
          : pos
          ? 'border-emerald-800/60 hover:border-emerald-700'
          : neg
          ? 'border-red-800/60 hover:border-red-700'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0">
          <p className="font-bold text-white text-sm">{ticker.symbol}</p>
          <p className="text-xs text-slate-500 truncate">{ticker.name}</p>
        </div>
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pos ? 'text-emerald-400' : neg ? 'text-red-400' : 'text-slate-500'}`} />
      </div>

      {sparkData.length > 0 && (
        <div className="h-8 my-1 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={strokeColor} dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-base font-mono font-bold text-white">
        ${ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <span className={`text-xs font-semibold ${pos ? 'text-emerald-400' : neg ? 'text-red-400' : 'text-slate-400'}`}>
          {pos ? '+' : ''}{ticker.changePct.toFixed(2)}%
        </span>
        <span className="text-xs text-slate-600">Vol: {ticker.volume}</span>
      </div>
    </button>
  )
}
