'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ALL_SYMBOLS } from '@/lib/mockData'
import { BookMarked, Plus, RefreshCw, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface Trade {
  id: string
  ticker: string
  entry: number
  exit: number | null
  shares: number
  notes: string
  date: string
  side?: 'BUY' | 'SELL'
}

type HistoryPoint = {
  isoDate?: string
  date: string
  price: number
  rsi: number
}

type ChartPoint = HistoryPoint & {
  entryPrice?: number
  exitPrice?: number
}

const STORAGE_KEY = 'quantdash-paper-trades'

const sampleTrades: Trade[] = [
  { id: '1', ticker: 'AAPL', entry: 210.00, exit: 218.50, shares: 50, notes: 'RSI bounce from 28, held 3 days', date: '2025-10-14', side: 'BUY' },
  { id: '2', ticker: 'NVDA', entry: 890.00, exit: 875.00, shares: 10, notes: 'Missed the breakdown signal, cut quickly', date: '2025-10-18', side: 'BUY' },
  { id: '3', ticker: 'SPY', entry: 518.00, exit: null, shares: 20, notes: 'FOMC gap fill - still holding', date: '2025-10-22', side: 'BUY' },
]

function money(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function percent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function tradePnL(trade: Trade) {
  if (trade.exit === null) return null
  const direction = trade.side === 'SELL' ? -1 : 1
  return (trade.exit - trade.entry) * trade.shares * direction
}

function tradePnLPct(trade: Trade) {
  if (trade.exit === null) return null
  const direction = trade.side === 'SELL' ? -1 : 1
  return ((trade.exit - trade.entry) / trade.entry) * 100 * direction
}

export default function TradingJournal({ symbol: externalSymbol = 'AAPL' }: { symbol?: string }) {
  const [trades, setTrades] = useState<Trade[]>(sampleTrades)
  const [storageReady, setStorageReady] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState(externalSymbol)
  const [form, setForm] = useState({ ticker: externalSymbol, side: 'BUY', entry: '', exit: '', shares: '', notes: '' })
  const [adding, setAdding] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'trades'>('overview')
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedTicker(externalSymbol)
    setForm(prev => ({ ...prev, ticker: externalSymbol }))
  }, [externalSymbol])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Trade[]
        setTrades(parsed.map(trade => ({ ...trade, side: trade.side ?? 'BUY' })))
      }
    } catch {
      // Keep the starter journal if saved data is invalid or unavailable.
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades))
  }, [storageReady, trades])

  const loadChart = useCallback(async () => {
    setLoadingChart(true)
    setChartError(null)
    try {
      const response = await fetch(`/api/history/${selectedTicker}?range=6M`, { cache: 'no-store' })
      if (!response.ok) throw new Error('History unavailable')
      const json = await response.json()
      setHistory(json.data ?? [])
    } catch {
      setHistory([])
      setChartError('Price chart unavailable for this ticker right now.')
    } finally {
      setLoadingChart(false)
    }
  }, [selectedTicker])

  useEffect(() => {
    void loadChart()
  }, [loadChart])

  const closedTrades = trades.filter(trade => trade.exit !== null)
  const openTrades = trades.filter(trade => trade.exit === null)
  const totalPnL = closedTrades.reduce((sum, trade) => sum + (tradePnL(trade) ?? 0), 0)
  const wins = closedTrades.filter(trade => (tradePnL(trade) ?? 0) >= 0)
  const losses = closedTrades.filter(trade => (tradePnL(trade) ?? 0) < 0)
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0
  const averageWin = wins.length > 0 ? wins.reduce((sum, trade) => sum + (tradePnL(trade) ?? 0), 0) / wins.length : 0
  const averageLoss = losses.length > 0 ? losses.reduce((sum, trade) => sum + (tradePnL(trade) ?? 0), 0) / losses.length : 0

  const equityCurve = useMemo(() => {
    let equity = 0
    return [...closedTrades]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trade, index) => {
        equity += tradePnL(trade) ?? 0
        return {
          label: `T${index + 1}`,
          equity: +equity.toFixed(2),
          pnl: +(tradePnL(trade) ?? 0).toFixed(2),
          ticker: trade.ticker,
        }
      })
  }, [closedTrades])

  const tickerStats = useMemo(() => {
    const totals = new Map<string, { ticker: string; pnl: number; trades: number }>()
    for (const trade of closedTrades) {
      const current = totals.get(trade.ticker) ?? { ticker: trade.ticker, pnl: 0, trades: 0 }
      current.pnl += tradePnL(trade) ?? 0
      current.trades += 1
      totals.set(trade.ticker, current)
    }
    return Array.from(totals.values()).sort((a, b) => b.pnl - a.pnl)
  }, [closedTrades])

  const selectedTrades = useMemo(
    () => trades.filter(trade => trade.ticker === selectedTicker),
    [selectedTicker, trades]
  )

  const chartData = useMemo<ChartPoint[]>(() => {
    return history.map((point, index) => {
      const matchingEntry = selectedTrades.find(trade => {
        if (point.isoDate && trade.date === point.isoDate) return true
        if (!point.isoDate && index === 0) return true
        return false
      })
      const matchingExit = selectedTrades.find(trade => trade.exit !== null && point.isoDate && trade.date === point.isoDate)

      return {
        ...point,
        entryPrice: matchingEntry?.entry,
        exitPrice: matchingExit?.exit ?? undefined,
      }
    })
  }, [history, selectedTrades])

  function addTrade() {
    const ticker = form.ticker.trim().toUpperCase()
    const entry = Number(form.entry)
    const exit = form.exit !== '' ? Number(form.exit) : null
    const shares = Number(form.shares)
    if (!ticker || entry <= 0 || shares <= 0) return

    const trade: Trade = {
      id: Date.now().toString(),
      ticker,
      side: form.side as 'BUY' | 'SELL',
      entry,
      exit,
      shares,
      notes: form.notes,
      date: new Date().toISOString().split('T')[0],
    }
    setTrades(prev => [trade, ...prev])
    setSelectedTicker(ticker)
    setForm({ ticker, side: 'BUY', entry: '', exit: '', shares: '', notes: '' })
    setAdding(false)
  }

  function deleteTrade(id: string) {
    setTrades(prev => prev.filter(trade => trade.id !== id))
  }

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col gap-4 mb-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-pink-500/20 bg-pink-500/10 p-2">
            <BookMarked className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Paper Trading Journal</h2>
            <p className="text-xs text-slate-500">Clean trade review with performance and chart markers</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTicker}
            onChange={event => setSelectedTicker(event.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500"
          >
            {ALL_SYMBOLS.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <button
            onClick={loadChart}
            disabled={loadingChart}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingChart ? 'animate-spin' : ''}`} />
            Chart
          </button>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 text-xs font-medium rounded-lg border border-pink-600/30 transition-all"
          >
            <Plus className="w-3 h-3" /> Log Trade
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <select
              value={form.ticker}
              onChange={event => setForm({ ...form, ticker: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500"
            >
              {ALL_SYMBOLS.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select
              value={form.side}
              onChange={event => setForm({ ...form, side: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500"
            >
              <option value="BUY">Buy / Long</option>
              <option value="SELL">Sell / Short</option>
            </select>
            <input
              type="number"
              placeholder="Shares"
              value={form.shares}
              onChange={event => setForm({ ...form, shares: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
            />
            <input
              type="number"
              placeholder="Entry price"
              value={form.entry}
              onChange={event => setForm({ ...form, entry: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
            />
            <input
              type="number"
              placeholder="Exit price optional"
              value={form.exit}
              onChange={event => setForm({ ...form, exit: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
            />
          </div>
          <input
            placeholder="Notes: setup, mistake, emotion, lesson"
            value={form.notes}
            onChange={event => setForm({ ...form, notes: event.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
          />
          <div className="flex gap-2">
            <button onClick={addTrade} className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium rounded transition-all">
              Add Trade
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_2fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Closed P&L</p>
          <p className={`mt-1 font-mono text-3xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{money(totalPnL)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {closedTrades.length} closed trades, {openTrades.length} open trade{openTrades.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Win Rate" value={`${winRate.toFixed(1)}%`} color={winRate >= 50 ? 'text-emerald-400' : 'text-yellow-400'} hint={`${wins.length}W / ${losses.length}L`} />
          <Metric label="Open" value={openTrades.length.toString()} color="text-yellow-400" hint="Active ideas" />
          <Metric label="Avg Win" value={money(averageWin)} color="text-emerald-400" hint="Closed winners" />
          <Metric label="Avg Loss" value={money(averageLoss)} color="text-red-400" hint="Closed losers" />
        </div>
      </div>

      <div className="mb-5 flex rounded-lg border border-slate-800 bg-slate-950/40 p-1">
        {(['overview', 'trades'] as const).map(view => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium capitalize transition-colors ${
              activeView === view ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {view === 'overview' ? 'Overview & Charts' : `Trades (${trades.length})`}
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
      <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3">
          <p className="mb-2 text-sm font-semibold text-white">Journal Equity Curve</p>
          <ResponsiveContainer width="100%" height={220} minWidth={0}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="journalEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value: number) => `$${value.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                formatter={(value, name) => [money(Number(value)), name === 'equity' ? 'Cumulative P&L' : 'Trade P&L'] as [string, string]}
              />
              <Area type="monotone" dataKey="equity" stroke="#ec4899" fill="url(#journalEquity)" strokeWidth={2} dot />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3">
          <p className="mb-2 text-sm font-semibold text-white">P&L by Ticker</p>
          <ResponsiveContainer width="100%" height={220} minWidth={0}>
            <BarChart data={tickerStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="ticker" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value: number) => `$${value.toFixed(0)}`} />
              <Tooltip
                contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                formatter={(value) => [money(Number(value)), 'P&L'] as [string, string]}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {tickerStats.map(row => <Cell key={row.ticker} fill={row.pnl >= 0 ? '#22c55e' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-slate-800 bg-slate-950/30 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">{selectedTicker} Price With Trade Markers</p>
          <p className="text-xs text-slate-600">Green = entry, red = exit</p>
        </div>
        {chartError && <p className="mb-2 text-xs text-amber-300">{chartError}</p>}
        <ResponsiveContainer width="100%" height={260} minWidth={0}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="journalPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} minTickGap={24} />
            <YAxis domain={['dataMin', 'dataMax']} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value: number) => `$${value.toFixed(0)}`} />
            <Tooltip
              contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name === 'price' ? 'Price' : name === 'entryPrice' ? 'Entry' : 'Exit'] as [string, string]}
            />
            <Area type="monotone" dataKey="price" stroke="#60a5fa" fill="url(#journalPrice)" strokeWidth={2} dot={false} />
            {chartData.filter(point => point.entryPrice).map(point => (
              <ReferenceDot key={`entry-${point.date}`} x={point.date} y={point.entryPrice} r={5} fill="#22c55e" stroke="#dcfce7" />
            ))}
            {chartData.filter(point => point.exitPrice).map(point => (
              <ReferenceDot key={`exit-${point.date}`} x={point.date} y={point.exitPrice} r={5} fill="#ef4444" stroke="#fee2e2" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </>
      )}

      {activeView === 'trades' && (
      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
        {trades.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">No trades logged yet.</p>
        )}
        {trades.map(trade => {
          const isOpen = trade.exit === null
          const pnl = tradePnL(trade)
          const pnlPct = tradePnLPct(trade)
          const win = pnl !== null && pnl >= 0

          return (
            <div
              key={trade.id}
              className={`p-3 rounded-lg border ${
                isOpen
                  ? 'border-yellow-800/50 bg-yellow-900/10'
                  : win
                  ? 'border-emerald-900/50 bg-emerald-900/10'
                  : 'border-red-900/50 bg-red-900/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {isOpen
                    ? <Minus className="w-3.5 h-3.5 text-yellow-400" />
                    : win
                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  }
                  <span className="font-bold text-white text-sm">{trade.ticker}</span>
                  <span className="text-xs text-slate-500">{trade.side ?? 'BUY'} {trade.shares} shares</span>
                  {isOpen
                    ? <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 border border-yellow-400/25 px-1.5 py-0.5 rounded">Open</span>
                    : <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-1.5 py-0.5 rounded">Closed</span>
                  }
                  <span className="text-xs text-slate-600">{trade.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <span className="font-bold text-sm font-mono text-yellow-400">Open</span>
                  ) : (
                    <span className={`font-bold text-sm font-mono ${win ? 'text-emerald-400' : 'text-red-400'}`}>
                      {money(pnl ?? 0)} <span className="text-xs font-normal">({percent(pnlPct ?? 0)})</span>
                    </span>
                  )}
                  <button onClick={() => deleteTrade(trade.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 ml-5">
                <span className="text-xs text-slate-500">Entry: <span className="text-slate-300">${trade.entry}</span></span>
                {isOpen
                  ? <span className="text-xs text-slate-500">Exit: <span className="text-yellow-500">pending</span></span>
                  : <span className="text-xs text-slate-500">Exit: <span className="text-slate-300">${trade.exit}</span></span>
                }
              </div>
              {trade.notes && <p className="text-xs text-slate-500 mt-1.5 ml-5 italic">&quot;{trade.notes}&quot;</p>}
            </div>
          )
        })}
      </div>
      )}
    </section>
  )
}

function Metric({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`font-mono text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </div>
  )
}
