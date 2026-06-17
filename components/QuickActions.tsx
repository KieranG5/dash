'use client'

import { FormEvent, useState } from 'react'
import { Activity, BriefcaseBusiness, Calculator, FlaskConical, Search, Sparkles } from 'lucide-react'
import { ALL_SYMBOLS } from '@/lib/mockData'

interface QuickActionsProps {
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
  onOpenTool: (tool: 'signals' | 'calc' | 'backtest' | 'portfolio' | 'journal') => void
}

const suggestions = [
  { label: 'Analyze NVDA', value: 'analyze NVDA', icon: Activity },
  { label: 'Position size', value: 'position size', icon: Calculator },
  { label: 'Run backtest', value: 'run backtest', icon: FlaskConical },
  { label: 'Portfolio', value: 'open portfolio', icon: BriefcaseBusiness },
]

export default function QuickActions({
  selectedSymbol,
  onSelectSymbol,
  onOpenTool,
}: QuickActionsProps) {
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState(`Ready to analyze ${selectedSymbol}.`)

  function runCommand(value: string) {
    const normalized = value.trim().toUpperCase()
    const symbol = ALL_SYMBOLS.find(candidate =>
      normalized === candidate ||
      normalized.endsWith(` ${candidate}`) ||
      normalized.includes(` ${candidate} `)
    )

    if (symbol) {
      onSelectSymbol(symbol)
      setMessage(`${symbol} selected. Opening indicators.`)
      setQuery('')
      return
    }

    if (normalized.includes('POSITION') || normalized.includes('CALC') || normalized.includes('RISK')) {
      onOpenTool('calc')
      setMessage('Position sizing calculator opened.')
    } else if (normalized.includes('BACKTEST') || normalized.includes('SIMULAT')) {
      onOpenTool('backtest')
      setMessage('Backtest simulator opened.')
    } else if (
      normalized.includes('PORTFOLIO') ||
      normalized.includes('HOLDING') ||
      normalized.includes('ALLOCATION') ||
      normalized.includes('FUND') ||
      normalized.includes('WEIGHT')
    ) {
      onOpenTool('portfolio')
      setMessage('Portfolio management opened.')
    } else if (normalized.includes('JOURNAL') || normalized.includes('TRADE')) {
      onOpenTool('journal')
      setMessage('Paper trading journal opened.')
    } else if (normalized.includes('SIGNAL') || normalized.includes('INDICATOR') || normalized.includes('RSI')) {
      onOpenTool('signals')
      setMessage(`Indicators opened for ${selectedSymbol}.`)
    } else {
      setMessage('Try a ticker, "position size", "run backtest", or "open journal".')
    }
    setQuery('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim()) runCommand(query)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-blue-900/40 bg-[#0d1221]">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3 sm:w-64">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Quick Actions</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Jump to a ticker or dashboard tool.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="quick-action">
            Search tickers and tools
          </label>
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950/60 focus-within:border-blue-500">
            <Search className="ml-3 h-4 w-4 flex-shrink-0 text-slate-500" />
            <input
              id="quick-action"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={`Try "analyze ${selectedSymbol}" or "position size"`}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="mr-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Go
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-800/80 bg-slate-950/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500" aria-live="polite">{message}</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {suggestions.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => runCommand(value)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
