'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Plus, Trash2, RefreshCw, Target } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ALL_SYMBOLS, extendedTickers } from '@/lib/mockData'

type Holding = {
  id: string
  symbol: string
  shares: number
  avgCost: number
}

type Quote = {
  symbol: string
  price: number
}

type HoldingReturn = {
  symbol: string
  periodReturn: number
}

type Range = '1M' | '3M' | '6M' | '1Y'

const STORAGE_KEY = 'quantdash-portfolio-holdings'
const RANGES: Range[] = ['1M', '3M', '6M', '1Y']
const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#facc15', '#06b6d4', '#ec4899', '#94a3b8']

const starterHoldings: Holding[] = [
  { id: '1', symbol: 'AAPL', shares: 12, avgCost: 245 },
  { id: '2', symbol: 'NVDA', shares: 8, avgCost: 180 },
  { id: '3', symbol: 'SPY', shares: 10, avgCost: 690 },
]

function formatMoney(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function PortfolioManager() {
  const [holdings, setHoldings] = useState<Holding[]>(starterHoldings)
  const [storageReady, setStorageReady] = useState(false)
  const [form, setForm] = useState({ symbol: '', shares: '', avgCost: '' })
  const [adding, setAdding] = useState(false)
  const [range, setRange] = useState<Range>('3M')
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [returns, setReturns] = useState<Record<string, HoldingReturn>>({})
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const refreshPortfolio = useCallback(async () => {
    if (holdings.length === 0) return
    setLoading(true)
    try {
      const quoteRes = await fetch('/api/quotes', { cache: 'no-store' })
      if (quoteRes.ok) {
        const quoteJson = await quoteRes.json()
        const nextQuotes: Record<string, Quote> = {}
        for (const quote of quoteJson.quotes ?? []) {
          nextQuotes[quote.symbol] = quote
        }
        setQuotes(nextQuotes)
      }

      const nextReturns: Record<string, HoldingReturn> = {}
      await Promise.all(holdings.map(async holding => {
        try {
          const res = await fetch(`/api/history/${holding.symbol}?range=${range}`, { cache: 'no-store' })
          if (!res.ok) return
          const json = await res.json()
          const data = json.data ?? []
          if (data.length < 2) return
          const first = data[0].price
          const last = data[data.length - 1].price
          nextReturns[holding.symbol] = {
            symbol: holding.symbol,
            periodReturn: first > 0 ? ((last - first) / first) * 100 : 0,
          }
        } catch {}
      }))
      setReturns(nextReturns)
      setLastUpdated(Date.now())
    } finally {
      setLoading(false)
    }
  }, [holdings, range])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setHoldings(JSON.parse(saved) as Holding[])
    } catch {
      // Keep starter portfolio if saved data is unavailable.
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
  }, [holdings, storageReady])

  useEffect(() => {
    refreshPortfolio()
    const interval = setInterval(refreshPortfolio, 60_000)
    return () => clearInterval(interval)
  }, [refreshPortfolio])

  function addHolding() {
    const symbol = form.symbol.trim().toUpperCase()
    const shares = Number(form.shares)
    const avgCost = Number(form.avgCost)
    if (!ALL_SYMBOLS.includes(symbol) || shares <= 0 || avgCost < 0) return

    setHoldings(prev => {
      const existing = prev.find(holding => holding.symbol === symbol)
      if (!existing) {
        return [{ id: Date.now().toString(), symbol, shares, avgCost }, ...prev]
      }

      const totalShares = existing.shares + shares
      const blendedCost = totalShares > 0
        ? ((existing.avgCost * existing.shares) + (avgCost * shares)) / totalShares
        : avgCost

      return prev.map(holding =>
        holding.symbol === symbol
          ? { ...holding, shares: totalShares, avgCost: blendedCost }
          : holding
      )
    })
    setForm({ symbol: '', shares: '', avgCost: '' })
    setAdding(false)
  }

  function deleteHolding(id: string) {
    setHoldings(prev => prev.filter(holding => holding.id !== id))
  }

  const rows = useMemo(() => {
    const totalValue = holdings.reduce((sum, holding) => {
      const price = quotes[holding.symbol]?.price ?? holding.avgCost
      return sum + price * holding.shares
    }, 0)

    return holdings.map((holding, index) => {
      const ticker = extendedTickers.find(t => t.symbol === holding.symbol)
      const price = quotes[holding.symbol]?.price ?? holding.avgCost
      const value = price * holding.shares
      const cost = holding.avgCost * holding.shares
      const pnl = value - cost
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0
      const periodReturn = returns[holding.symbol]?.periodReturn ?? 0
      const contribution = (weight / 100) * periodReturn

      return {
        ...holding,
        name: ticker?.name ?? holding.symbol,
        region: ticker?.region.toUpperCase() ?? 'CUSTOM',
        price,
        value,
        cost,
        pnl,
        pnlPct,
        weight,
        periodReturn,
        contribution,
        color: COLORS[index % COLORS.length],
      }
    }).sort((a, b) => b.value - a.value)
  }, [holdings, quotes, returns])

  const totalValue = rows.reduce((sum, row) => sum + row.value, 0)
  const totalCost = rows.reduce((sum, row) => sum + row.cost, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const portfolioPeriodReturn = rows.reduce((sum, row) => sum + row.contribution, 0)
  const best = [...rows].sort((a, b) => b.periodReturn - a.periodReturn)[0]
  const worst = [...rows].sort((a, b) => a.periodReturn - b.periodReturn)[0]
  const largest = rows[0]
  const contributionRows = [...rows].sort((a, b) => b.contribution - a.contribution)
  const concentrationRisk = largest && largest.weight > 40

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="w-4 h-4 text-amber-400" />
          <div>
            <h2 className="font-semibold text-white">Portfolio Management</h2>
            <p className="text-xs text-slate-500">Allocation, returns, and contribution analysis</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(value => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                range === value ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {value}
            </button>
          ))}
          <button
            onClick={refreshPortfolio}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setAdding(!adding)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-medium rounded-lg border border-amber-600/30 transition-all"
          >
            <Plus className="w-3 h-3" /> Add Holding
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              placeholder="Ticker (AAPL)"
              value={form.symbol}
              onChange={event => setForm({ ...form, symbol: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
            />
            <input
              type="number"
              placeholder="Shares"
              value={form.shares}
              onChange={event => setForm({ ...form, shares: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
            />
            <input
              type="number"
              placeholder="Average cost"
              value={form.avgCost}
              onChange={event => setForm({ ...form, avgCost: event.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
          <p className="text-xs text-slate-600">
            Uses supported dashboard tickers. Adding the same ticker blends your average cost.
          </p>
          <div className="flex gap-2">
            <button onClick={addHolding} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded transition-all">
              Save Holding
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <Metric label="Portfolio Value" value={formatMoney(totalValue)} color="text-white" hint={`${rows.length} holdings`} />
        <Metric label="Unrealized P&L" value={`${totalPnl >= 0 ? '+' : ''}${formatMoney(totalPnl)}`} color={totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} hint={formatPercent(totalPnlPct)} />
        <Metric label={`${range} Return`} value={formatPercent(portfolioPeriodReturn)} color={portfolioPeriodReturn >= 0 ? 'text-emerald-400' : 'text-red-400'} hint="Weighted contribution" />
        <Metric label="Best Holding" value={best?.symbol ?? '-'} color="text-blue-400" hint={best ? formatPercent(best.periodReturn) : 'No data'} />
        <Metric label="Largest Weight" value={largest ? `${largest.symbol} ${largest.weight.toFixed(1)}%` : '-'} color={concentrationRisk ? 'text-yellow-400' : 'text-slate-200'} hint={concentrationRisk ? 'Concentration risk' : 'Balanced'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Fund Wheel</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256} minWidth={0}>
              <PieChart>
                <Pie data={rows} dataKey="value" nameKey="symbol" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {rows.map(row => <Cell key={row.symbol} fill={row.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(value, _name, item) => {
                    const row = item.payload as (typeof rows)[number]
                    return [`${formatMoney(Number(value))} (${row.weight.toFixed(1)}%)`, row.symbol] as [string, string]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {rows.map(row => (
              <div key={row.symbol} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                <span className="font-mono text-slate-200">{row.symbol}</span>
                <span>{row.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4">
          <p className="text-sm font-semibold text-white mb-3">Return Contribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256} minWidth={0}>
              <BarChart data={contributionRows} layout="vertical" margin={{ left: 8, right: 12 }}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value: number) => `${value.toFixed(1)}%`} />
                <YAxis type="category" dataKey="symbol" tick={{ fill: '#cbd5e1', fontSize: 10 }} width={54} />
                <Tooltip
                  contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Contribution'] as [string, string]}
                />
                <Bar dataKey="contribution" radius={[4, 4, 4, 4]}>
                  {contributionRows.map(row => <Cell key={row.symbol} fill={row.contribution >= 0 ? '#22c55e' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className="text-slate-500">Best period return: <span className="font-mono text-emerald-400">{best ? `${best.symbol} ${formatPercent(best.periodReturn)}` : '-'}</span></p>
            <p className="text-slate-500">Weakest period return: <span className="font-mono text-red-400">{worst ? `${worst.symbol} ${formatPercent(worst.periodReturn)}` : '-'}</span></p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Holding</th>
              <th className="py-2 pr-4 text-right">Shares</th>
              <th className="py-2 pr-4 text-right">Weight</th>
              <th className="py-2 pr-4 text-right">Value</th>
              <th className="py-2 pr-4 text-right">P&L</th>
              <th className="py-2 pr-4 text-right">{range} Return</th>
              <th className="py-2 pr-4 text-right">Contribution</th>
              <th className="py-2 text-right">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-slate-900 text-slate-300">
                <td className="py-2 pr-4">
                  <p className="font-mono font-bold text-white">{row.symbol}</p>
                  <p className="text-xs text-slate-600">{row.name} - {row.region}</p>
                </td>
                <td className="py-2 pr-4 text-right font-mono">{row.shares.toLocaleString()}</td>
                <td className="py-2 pr-4 text-right font-mono">{row.weight.toFixed(1)}%</td>
                <td className="py-2 pr-4 text-right font-mono">{formatMoney(row.value)}</td>
                <td className={`py-2 pr-4 text-right font-mono ${row.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(row.pnlPct)}
                </td>
                <td className={`py-2 pr-4 text-right font-mono ${row.periodReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(row.periodReturn)}
                </td>
                <td className={`py-2 pr-4 text-right font-mono ${row.contribution >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(row.contribution)}
                </td>
                <td className="py-2 text-right">
                  <button onClick={() => deleteHolding(row.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">No holdings yet. Add shares to start portfolio analysis.</p>
        )}
      </div>

      {lastUpdated && (
        <p className="mt-3 text-xs text-slate-600">
          Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Uses Yahoo-backed quotes and history; educational analysis only.
        </p>
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
