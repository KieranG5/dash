'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { extendedTickers } from '@/lib/mockData'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FlaskConical, RefreshCw } from 'lucide-react'

type BacktestRange = '3M' | '6M' | '1Y'

type HistoryPoint = {
  isoDate?: string
  date: string
  price: number
  rsi: number
}

type EquityPoint = {
  date: string
  equity: number
  benchmark: number
  drawdown: number
}

type Trade = {
  entryDate: string
  exitDate: string
  entryPrice: number
  exitPrice: number
  shares: number
  pnl: number
  pnlPct: number
  reason: string
}

type BacktestResult = {
  totalReturn: number
  benchmarkReturn: number
  alpha: number
  sharpe: number
  maxDrawdown: number
  winRate: number
  numTrades: number
  finalEquity: number
  exposure: number
  profitFactor: number
  equityCurve: EquityPoint[]
  trades: Trade[]
}

const RANGES: BacktestRange[] = ['3M', '6M', '1Y']
const SYMBOLS = extendedTickers.map(ticker => ticker.symbol)

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

function emptyResult(initialCapital: number): BacktestResult {
  return {
    totalReturn: 0,
    benchmarkReturn: 0,
    alpha: 0,
    sharpe: 0,
    maxDrawdown: 0,
    winRate: 0,
    numTrades: 0,
    finalEquity: initialCapital,
    exposure: 0,
    profitFactor: 0,
    equityCurve: [],
    trades: [],
  }
}

function runRsiBacktest(
  history: HistoryPoint[],
  initialCapital: number,
  buyRsi: number,
  sellRsi: number,
  allocationPct: number,
  stopLossPct: number,
  takeProfitPct: number,
  commission: number
): BacktestResult {
  if (history.length < 15) return emptyResult(initialCapital)

  let cash = initialCapital
  let shares = 0
  let entryPrice = 0
  let entryDate = ''
  let peak = initialCapital
  let maxDrawdown = 0
  let exposedDays = 0
  const trades: Trade[] = []
  const equityCurve: EquityPoint[] = []
  const firstPrice = history[0].price

  for (let i = 0; i < history.length; i++) {
    const point = history[i]
    const isLastPoint = i === history.length - 1

    if (shares > 0) {
      exposedDays += 1
      const openReturn = ((point.price - entryPrice) / entryPrice) * 100
      const shouldStop = openReturn <= -stopLossPct
      const shouldTakeProfit = openReturn >= takeProfitPct
      const shouldExitSignal = point.rsi >= sellRsi

      if (shouldStop || shouldTakeProfit || shouldExitSignal || isLastPoint) {
        const proceeds = shares * point.price - commission
        cash += proceeds
        const pnl = (point.price - entryPrice) * shares - commission * 2
        trades.push({
          entryDate,
          exitDate: point.date,
          entryPrice,
          exitPrice: point.price,
          shares,
          pnl,
          pnlPct: ((point.price - entryPrice) / entryPrice) * 100,
          reason: shouldStop ? 'Stop loss' : shouldTakeProfit ? 'Take profit' : isLastPoint ? 'Closed at end' : 'RSI exit',
        })
        shares = 0
        entryPrice = 0
        entryDate = ''
      }
    }

    const currentEquityAfterExit = cash + shares * point.price
    if (shares === 0 && !isLastPoint && point.rsi <= buyRsi) {
      const deployable = currentEquityAfterExit * (allocationPct / 100)
      const nextShares = Math.max(0, (deployable - commission) / point.price)
      if (nextShares > 0) {
        shares = nextShares
        entryPrice = point.price
        entryDate = point.date
        cash -= shares * point.price + commission
      }
    }

    const equity = cash + shares * point.price
    peak = Math.max(peak, equity)
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0
    maxDrawdown = Math.max(maxDrawdown, drawdown)
    const benchmark = initialCapital * (point.price / firstPrice)

    equityCurve.push({
      date: point.date,
      equity: +equity.toFixed(2),
      benchmark: +benchmark.toFixed(2),
      drawdown: +drawdown.toFixed(2),
    })
  }

  const finalEquity = equityCurve[equityCurve.length - 1]?.equity ?? initialCapital
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100
  const benchmarkReturn = ((history[history.length - 1].price - firstPrice) / firstPrice) * 100
  const dailyReturns = equityCurve.map((point, index) =>
    index === 0 ? 0 : (point.equity - equityCurve[index - 1].equity) / equityCurve[index - 1].equity
  )
  const avgReturn = dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length
  const variance = dailyReturns.reduce((sum, value) => sum + (value - avgReturn) ** 2, 0) / dailyReturns.length
  const stdDev = Math.sqrt(variance)
  const wins = trades.filter(trade => trade.pnl > 0)
  const losses = trades.filter(trade => trade.pnl < 0)
  const grossProfit = wins.reduce((sum, trade) => sum + trade.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0))

  return {
    totalReturn: +totalReturn.toFixed(2),
    benchmarkReturn: +benchmarkReturn.toFixed(2),
    alpha: +(totalReturn - benchmarkReturn).toFixed(2),
    sharpe: +(stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0).toFixed(2),
    maxDrawdown: +maxDrawdown.toFixed(2),
    winRate: trades.length > 0 ? +((wins.length / trades.length) * 100).toFixed(1) : 0,
    numTrades: trades.length,
    finalEquity: +finalEquity.toFixed(2),
    exposure: +((exposedDays / history.length) * 100).toFixed(1),
    profitFactor: grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? 99 : 0,
    equityCurve,
    trades,
  }
}

export default function BacktestSimulator({ symbol: externalSymbol = 'AAPL' }: { symbol?: string }) {
  const [symbol, setSymbol] = useState(externalSymbol)
  const [range, setRange] = useState<BacktestRange>('1Y')
  const [capital, setCapital] = useState('100000')
  const [buyRsi, setBuyRsi] = useState('40')
  const [sellRsi, setSellRsi] = useState('58')
  const [allocation, setAllocation] = useState('95')
  const [stopLoss, setStopLoss] = useState('8')
  const [takeProfit, setTakeProfit] = useState('14')
  const [commission, setCommission] = useState('1')
  const [results, setResults] = useState<BacktestResult>(() => emptyResult(100000))
  const [view, setView] = useState<'equity' | 'drawdown'>('equity')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<number | null>(null)
  const [dataSource, setDataSource] = useState('Yahoo Finance')

  useEffect(() => {
    setSymbol(externalSymbol)
  }, [externalSymbol])

  const canRun = useMemo(() => Number(capital) > 0 && Number(buyRsi) < Number(sellRsi), [capital, buyRsi, sellRsi])

  const run = useCallback(async () => {
    if (!canRun) {
      setError('Check the inputs: capital must be positive and buy RSI must be below sell RSI.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/history/${symbol}?range=${range}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('History request failed')

      const json = await response.json()
      const history = (json.data ?? [])
        .filter((point: HistoryPoint) => Number.isFinite(point.price) && Number.isFinite(point.rsi))
        .map((point: HistoryPoint) => ({
          date: point.isoDate ?? point.date,
          price: point.price,
          rsi: point.rsi,
        }))

      if (history.length < 15) throw new Error('Not enough historical bars for RSI backtest')

      const nextResults = runRsiBacktest(
        history,
        Number(capital),
        Number(buyRsi),
        Number(sellRsi),
        Number(allocation),
        Number(stopLoss),
        Number(takeProfit),
        Number(commission)
      )
      setResults(nextResults)
      setDataSource(json.source ?? 'Yahoo Finance')
      setLastRun(Date.now())
      if (nextResults.numTrades === 0) {
        setError('No trades matched these RSI rules. Try a higher buy RSI, lower sell RSI, or a longer range.')
      }
    } catch {
      setError('Yahoo Finance history was unavailable for this backtest. Try another symbol or range.')
    } finally {
      setLoading(false)
    }
  }, [allocation, buyRsi, canRun, capital, commission, range, sellRsi, stopLoss, symbol, takeProfit])

  useEffect(() => {
    void run()
  }, [run])

  const positiveReturn = results.totalReturn >= 0
  const topTrades = results.trades.slice(-5).reverse()

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-orange-400" />
          <div>
            <h2 className="font-semibold text-white">Backtest Simulator</h2>
            <p className="text-xs text-slate-500">Yahoo-backed RSI strategy test with benchmark comparison</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={symbol}
            onChange={event => setSymbol(event.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            {SYMBOLS.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          {RANGES.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                range === value ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {value}
            </button>
          ))}
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 mb-4">
        <Field label="Capital" value={capital} onChange={setCapital} prefix="$" />
        <Field label="Buy RSI" value={buyRsi} onChange={setBuyRsi} />
        <Field label="Sell RSI" value={sellRsi} onChange={setSellRsi} />
        <Field label="Allocation" value={allocation} onChange={setAllocation} suffix="%" />
        <Field label="Stop" value={stopLoss} onChange={setStopLoss} suffix="%" />
        <Field label="Target" value={takeProfit} onChange={setTakeProfit} suffix="%" />
        <Field label="Commission" value={commission} onChange={setCommission} prefix="$" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-5">
        <Stat label="Strategy Return" value={percent(results.totalReturn)} color={positiveReturn ? 'text-emerald-400' : 'text-red-400'} hint="Net of commission" />
        <Stat label="Buy & Hold" value={percent(results.benchmarkReturn)} color={results.benchmarkReturn >= 0 ? 'text-emerald-400' : 'text-red-400'} hint={`${symbol} benchmark`} />
        <Stat label="Alpha" value={percent(results.alpha)} color={results.alpha >= 0 ? 'text-emerald-400' : 'text-red-400'} hint="Strategy minus hold" />
        <Stat label="Sharpe" value={results.sharpe.toFixed(2)} color={results.sharpe > 1 ? 'text-emerald-400' : results.sharpe > 0 ? 'text-yellow-400' : 'text-red-400'} hint="Risk adjusted" />
        <Stat label="Max Drawdown" value={`-${results.maxDrawdown.toFixed(1)}%`} color="text-red-400" hint="Worst peak to trough" />
        <Stat label="Win Rate" value={`${results.winRate}%`} color={results.winRate > 55 ? 'text-emerald-400' : 'text-yellow-400'} hint={`${results.numTrades} trades`} />
        <Stat label="Final Equity" value={money(results.finalEquity)} color="text-white" hint={`${results.exposure}% exposure`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex gap-2">
          {(['equity', 'drawdown'] as const).map(value => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`px-3 py-1 text-xs rounded transition-all ${
                view === value
                  ? 'bg-orange-600/30 text-orange-300 border border-orange-600/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {value === 'equity' ? 'Equity vs Buy & Hold' : 'Drawdown'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600">
          Source: {dataSource}{lastRun ? ` · Ran ${new Date(lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </p>
      </div>

      <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/30 p-3">
        <ResponsiveContainer width="100%" height={260} minWidth={0}>
          <LineChart data={results.equityCurve} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} minTickGap={24} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) => view === 'equity' ? `$${(value / 1000).toFixed(0)}K` : `-${value.toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{ background: '#0d1221', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              formatter={(value, name) => {
                const numberValue = typeof value === 'number' ? value : 0
                if (view === 'drawdown') return [`-${numberValue.toFixed(2)}%`, 'Drawdown'] as [string, string]
                return [money(numberValue), name === 'benchmark' ? 'Buy & Hold' : 'Strategy'] as [string, string]
              }}
            />
            {view === 'equity' ? (
              <>
                <Line type="monotone" dataKey="equity" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="benchmark" stroke="#60a5fa" strokeWidth={1.7} dot={false} strokeDasharray="4 4" />
              </>
            ) : (
              <Line type="monotone" dataKey="drawdown" stroke="#f87171" strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-3">
          <p className="text-sm font-semibold text-white mb-2">Strategy Rules</p>
          <div className="space-y-2 text-xs text-slate-400">
            <p>Enter long when RSI is at or below <span className="font-mono text-orange-300">{buyRsi}</span>.</p>
            <p>Exit when RSI reaches <span className="font-mono text-orange-300">{sellRsi}</span>, stop loss hits, target hits, or the test ends.</p>
            <p>Profit factor: <span className="font-mono text-slate-200">{results.profitFactor}</span></p>
          </div>
        </div>

        <div className="xl:col-span-2 overflow-x-auto scrollbar-hide rounded-lg border border-slate-800 bg-slate-950/30 p-3">
          <p className="text-sm font-semibold text-white mb-2">Recent Trades</p>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-left uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Entry</th>
                <th className="py-2 pr-3">Exit</th>
                <th className="py-2 pr-3 text-right">Buy</th>
                <th className="py-2 pr-3 text-right">Sell</th>
                <th className="py-2 pr-3 text-right">P&L</th>
                <th className="py-2 text-right">Reason</th>
              </tr>
            </thead>
            <tbody>
              {topTrades.map((trade, index) => (
                <tr key={`${trade.entryDate}-${trade.exitDate}-${index}`} className="border-b border-slate-900 text-slate-300">
                  <td className="py-2 pr-3 font-mono">{trade.entryDate}</td>
                  <td className="py-2 pr-3 font-mono">{trade.exitDate}</td>
                  <td className="py-2 pr-3 text-right font-mono">${trade.entryPrice.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right font-mono">${trade.exitPrice.toFixed(2)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {money(trade.pnl)} ({percent(trade.pnlPct)})
                  </td>
                  <td className="py-2 text-right text-slate-500">{trade.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {topTrades.length === 0 && (
            <p className="py-5 text-center text-xs text-slate-500">No trades yet for these rules.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-3">
        Educational backtest only. It uses close-price fills, simplified fractional shares, and does not model slippage, tax, borrow cost, or liquidity.
      </p>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  prefix?: string
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <span className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-2 focus-within:border-orange-500">
        {prefix && <span className="text-xs text-slate-600">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={event => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-white outline-none"
        />
        {suffix && <span className="text-xs text-slate-600">{suffix}</span>}
      </span>
    </label>
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
