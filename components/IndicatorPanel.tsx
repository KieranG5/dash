'use client'

import { useState, useEffect, useCallback } from 'react'
import { generatePriceHistory, extendedTickers } from '@/lib/mockData'
import { useAlerts } from '@/context/AlertContext'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts'
import { Activity, RefreshCw } from 'lucide-react'

type HistoryPoint = {
  isoDate?: string
  date: string
  open?: number
  high?: number
  low?: number
  close?: number
  price: number
  volume?: number
  isPartial?: boolean
  rsi: number
  macd: number
  signal: number
  histogram: number
}

interface IndicatorPanelProps {
  symbol?: string
}

const SYMBOL_GROUPS = [
  { label: 'US', syms: extendedTickers.filter(t => t.region === 'us').map(t => t.symbol) },
  { label: 'ASX', syms: extendedTickers.filter(t => t.region === 'asx').map(t => t.symbol) },
  { label: 'Japan', syms: extendedTickers.filter(t => t.region === 'japan').map(t => t.symbol) },
  { label: 'HK', syms: extendedTickers.filter(t => t.region === 'hk').map(t => t.symbol) },
]

const RANGES = ['1D', '1M', '3M', '6M', '1Y'] as const
type ChartRange = typeof RANGES[number]

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

export default function IndicatorPanel({ symbol: externalSymbol }: IndicatorPanelProps) {
  const [selected, setSelected] = useState(externalSymbol ?? 'AAPL')
  const [data, setData] = useState<HistoryPoint[]>([])
  const [range, setRange] = useState<ChartRange>('3M')
  const [dataSource, setDataSource] = useState<'Yahoo Finance' | 'Simulated'>('Yahoo Finance')
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const { addAlert } = useAlerts()

  useEffect(() => {
    if (!externalSymbol) return
    setSelected(externalSymbol)
  }, [externalSymbol])

  const load = useCallback(async (sym: string, options?: { quiet?: boolean }) => {
    if (!options?.quiet) setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12_000)
    try {
      const res = await fetch(`/api/history/${sym}?range=${range}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data?.length > 0) {
          setData(json.data)
          setDataSource(json.source ?? 'Yahoo Finance')
          setLastUpdated(json.timestamp ?? Date.now())
          const latest: HistoryPoint = json.data[json.data.length - 1]
          if (latest.rsi < 30) addAlert({ symbol: sym, type: 'BUY', rsi: latest.rsi })
          if (latest.rsi > 70) addAlert({ symbol: sym, type: 'SELL', rsi: latest.rsi })
          setLoading(false)
          return
        }
      }
    } catch {}
    finally {
      window.clearTimeout(timeout)
    }

    // Fallback to simulated data
    const ticker = extendedTickers.find(t => t.symbol === sym) ?? extendedTickers[0]
    const fallback = generatePriceHistory(ticker.price)
    setData(fallback)
    setDataSource('Simulated')
    setLastUpdated(Date.now())
    setError('Yahoo Finance history was unavailable, so simulated data is shown.')
    const latest = fallback[fallback.length - 1]
    if (latest.rsi < 30) addAlert({ symbol: sym, type: 'BUY', rsi: latest.rsi })
    if (latest.rsi > 70) addAlert({ symbol: sym, type: 'SELL', rsi: latest.rsi })
    setLoading(false)
  }, [addAlert, range])

  useEffect(() => {
    void load(selected)
  }, [selected, load])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load(selected, { quiet: true })
      }
    }, 60_000)

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        void load(selected, { quiet: true })
      }
    }

    document.addEventListener('visibilitychange', refreshOnVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [selected, load])

  if (data.length === 0) return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5 flex items-center justify-center h-64">
      <span className="text-slate-500 text-sm animate-pulse">Loading indicators...</span>
    </section>
  )

  const latest = data[data.length - 1]
  const first = data[0]
  const priceChange = latest.price - first.price
  const priceChangePct = first.price > 0 ? (priceChange / first.price) * 100 : 0
  const rsiSignal = latest.rsi > 70 ? 'SELL' : latest.rsi < 30 ? 'BUY' : 'HOLD'
  const macdSignal = latest.histogram > 0 ? 'BUY' : latest.histogram < -0.5 ? 'SELL' : 'HOLD'

  const signalColor = (s: string) =>
    s === 'BUY' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' :
    s === 'SELL' ? 'text-red-400 bg-red-400/10 border-red-400/30' :
    'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'

  const rsiExplanation =
    rsiSignal === 'BUY'
      ? `RSI is ${latest.rsi.toFixed(0)} — the asset is oversold. Historically, this can signal a bounce.`
      : rsiSignal === 'SELL'
      ? `RSI is ${latest.rsi.toFixed(0)} — the asset is overbought. Momentum may be running out.`
      : `RSI is ${latest.rsi.toFixed(0)} — in neutral territory. No strong signal yet.`

  const macdExplanation =
    macdSignal === 'BUY' ? 'MACD histogram is positive — bullish momentum is building.' :
    macdSignal === 'SELL' ? 'MACD histogram is negative — bearish momentum is building.' :
    'MACD histogram is near zero — trend is unclear.'

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-white">
            RSI + MACD — <span className="text-blue-400">{selected}</span>
          </h2>
          {loading && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400">
            Source: <span className="text-slate-200">{dataSource}</span>
          </span>
          {latest.isPartial && (
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
              Latest bar uses current Yahoo price
            </span>
          )}
          {lastUpdated && (
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-500">
              Chart updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <span className={`rounded-full border px-2 py-1 text-xs ${
            priceChange >= 0
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}>
            {range}: {priceChange >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
          </span>
          {RANGES.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                range === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          {SYMBOL_GROUPS.map(group => (
            <div key={group.label} className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 w-10 flex-shrink-0">{group.label}</span>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
                {group.syms.map(sym => (
                  <button
                    key={sym}
                    onClick={() => setSelected(sym)}
                    className={`px-2 py-0.5 text-xs rounded transition-all flex-shrink-0 min-h-[26px] ${
                      selected === sym
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/30 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-500">Price chart</p>
            <p className="font-mono text-lg font-bold text-white">
              ${latest.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right text-xs">
            <div>
              <p className="text-slate-600">High</p>
              <p className="font-mono text-slate-300">${(latest.high ?? latest.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-600">Low</p>
              <p className="font-mono text-slate-300">${(latest.low ?? latest.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-600">Vol</p>
              <p className="font-mono text-slate-300">{formatCompact(latest.volume ?? 0)}</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240} minWidth={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} minTickGap={24} />
            <YAxis
              yAxisId="price"
              domain={['dataMin', 'dataMax']}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => `$${value.toFixed(0)}`}
            />
            <YAxis yAxisId="volume" hide domain={[0, 'dataMax']} />
            <Tooltip
              contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              formatter={(value, name) => {
                const numberValue = typeof value === 'number' ? value : 0
                if (name === 'volume') return [formatCompact(numberValue), 'Volume'] as [string, string]
                return [`$${numberValue.toFixed(2)}`, 'Close'] as [string, string]
              }}
            />
            <Bar yAxisId="volume" dataKey="volume" fill="#1e3a8a" opacity={0.28} />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#60a5fa"
              fill="url(#priceGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">RSI ({latest.rsi.toFixed(0)})</p>
          <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded border ${signalColor(rsiSignal)}`}>
            {rsiSignal}
          </span>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{rsiExplanation}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">MACD ({latest.histogram > 0 ? '+' : ''}{latest.histogram.toFixed(2)})</p>
          <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded border ${signalColor(macdSignal)}`}>
            {macdSignal}
          </span>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{macdExplanation}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-1">RSI (14)</p>
        <ResponsiveContainer width="100%" height={80} minWidth={0}>
          <LineChart data={data.slice(-30)}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [(typeof v === 'number' ? v : 0).toFixed(1), 'RSI'] as [string, string]}
            />
            <ReferenceLine y={70} stroke="#f87171" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="#34d399" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="rsi" stroke="#60a5fa" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-1">MACD Histogram</p>
        <ResponsiveContainer width="100%" height={70} minWidth={0}>
          <BarChart data={data.slice(-30)}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [(typeof v === 'number' ? v : 0).toFixed(3), 'Histogram'] as [string, string]}
            />
            <Bar dataKey="histogram">
              {data.slice(-30).map((entry, i) => (
                <Cell key={i} fill={entry.histogram >= 0 ? '#34d399' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
