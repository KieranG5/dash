'use client'

import { useState, useEffect } from 'react'
import { runBacktest } from '@/lib/mockData'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { FlaskConical } from 'lucide-react'

export default function BacktestSimulator() {
  const [capital, setCapital] = useState('100000')
  const [results, setResults] = useState<ReturnType<typeof runBacktest> | null>(null)
  const [view, setView] = useState<'equity' | 'drawdown'>('equity')

  useEffect(() => {
    setResults(runBacktest(100000))
  }, [])

  function run() {
    const c = parseFloat(capital) || 100000
    setResults(runBacktest(c))
  }

  if (!results) return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5 flex items-center justify-center h-64">
      <span className="text-slate-500 text-sm">Loading...</span>
    </section>
  )

  const pos = results.totalReturn >= 0

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-orange-400" />
          <div>
            <h2 className="font-semibold text-white">Backtest Simulator</h2>
            <p className="text-xs text-slate-500">RSI Mean-Reversion Strategy · 1 Year · Daily</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={capital}
            onChange={e => setCapital(e.target.value)}
            placeholder="100000"
            className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
          />
          <button
            onClick={run}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            Run
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <Stat label="Total Return" value={`${pos ? '+' : ''}${results.totalReturn}%`} color={pos ? 'text-emerald-400' : 'text-red-400'} hint="Net P&L %" />
        <Stat label="Sharpe Ratio" value={results.sharpe.toFixed(2)} color={results.sharpe > 1 ? 'text-emerald-400' : results.sharpe > 0.5 ? 'text-yellow-400' : 'text-red-400'} hint=">1 is good" />
        <Stat label="Max Drawdown" value={`-${results.maxDrawdown.toFixed(1)}%`} color="text-red-400" hint="Worst peak→trough" />
        <Stat label="Win Rate" value={`${results.winRate}%`} color={results.winRate > 55 ? 'text-emerald-400' : 'text-yellow-400'} hint="% profitable trades" />
        <Stat label="# Trades" value={results.numTrades.toString()} color="text-blue-400" hint="Total signals" />
        <Stat label="Final Equity" value={`$${(results.finalEquity / 1000).toFixed(1)}K`} color="text-white" hint="End portfolio value" />
      </div>

      {/* Chart toggle */}
      <div className="flex gap-2 mb-3">
        {(['equity', 'drawdown'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 text-xs rounded transition-all ${view === v ? 'bg-orange-600/30 text-orange-300 border border-orange-600/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {v === 'equity' ? 'Equity Curve' : 'Drawdown'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={results.equityCurve} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={view === 'equity' ? '#f97316' : '#f87171'} stopOpacity={0.25} />
              <stop offset="95%" stopColor={view === 'equity' ? '#f97316' : '#f87171'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => view === 'equity' ? `$${(v / 1000).toFixed(0)}K` : `-${v.toFixed(1)}%`}
          />
          <Tooltip
            contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            formatter={(v) => {
              const num = typeof v === 'number' ? v : 0
              return [
                view === 'equity' ? `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `-${num.toFixed(2)}%`,
                view === 'equity' ? 'Equity' : 'Drawdown'
              ] as [string, string]
            }}
          />
          <Area
            type="monotone"
            dataKey={view === 'equity' ? 'equity' : 'drawdown'}
            stroke={view === 'equity' ? '#f97316' : '#f87171'}
            fill="url(#eqGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-slate-600 mt-3">
        Strategy: Enter long when RSI(14) crosses below 30 (oversold). Exit when RSI crosses above 50. Simulated on random walk price data.
      </p>
    </section>
  )
}

function Stat({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </div>
  )
}
