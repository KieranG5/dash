'use client'

import { useMemo, useState } from 'react'
import { BookOpen, Lightbulb } from 'lucide-react'

type FormulaCategory = 'risk' | 'performance' | 'portfolio'

type Formula = {
  id: string
  name: string
  category: FormulaCategory
  formula: string
  plain: string
  use: string
  limit: string
  quickRead: string
  color: string
}

const formulas: Formula[] = [
  {
    id: 'risk-reward',
    name: 'Risk / Reward',
    category: 'risk',
    formula: 'R = reward / risk',
    plain: 'Compares what you can make against what you are risking.',
    use: 'Use before entering a trade. A 2R setup means the target is twice as far from entry as the stop.',
    limit: 'A high R does not mean a high probability. Bad entries can still lose.',
    quickRead: '1R is breakeven logic, 2R+ is usually cleaner.',
    color: 'text-purple-400',
  },
  {
    id: 'position-size',
    name: 'Position Size',
    category: 'risk',
    formula: 'shares = dollar risk / risk per share',
    plain: 'Converts your risk limit into a share count.',
    use: 'Use with the position calculator so each trade risks the same percentage of account capital.',
    limit: 'Does not handle slippage or gaps through your stop.',
    quickRead: 'Controls damage before chasing returns.',
    color: 'text-pink-400',
  },
  {
    id: 'sharpe',
    name: 'Sharpe Ratio',
    category: 'performance',
    formula: 'Sharpe = (return - risk free rate) / volatility',
    plain: 'Measures return per unit of volatility.',
    use: 'Use to compare strategies. A smoother strategy can beat a higher-return but chaotic one.',
    limit: 'Can look too good when returns are not normally distributed or sample size is small.',
    quickRead: '>1 is useful, >2 is strong.',
    color: 'text-blue-400',
  },
  {
    id: 'drawdown',
    name: 'Max Drawdown',
    category: 'performance',
    formula: 'drawdown = (peak - trough) / peak',
    plain: 'Shows the worst fall from a high point.',
    use: 'Use to judge whether you could emotionally and financially survive a strategy.',
    limit: 'Future drawdowns can be worse than historical drawdowns.',
    quickRead: 'Lower drawdown is easier to stick with.',
    color: 'text-red-400',
  },
  {
    id: 'alpha',
    name: 'Alpha',
    category: 'performance',
    formula: 'alpha = strategy return - expected market return',
    plain: 'Shows whether you beat the market after adjusting for market exposure.',
    use: 'Use in backtesting and portfolio review to see if active decisions added value.',
    limit: 'Needs a sensible benchmark. A bad benchmark makes alpha misleading.',
    quickRead: 'Positive alpha means your decisions helped.',
    color: 'text-emerald-400',
  },
  {
    id: 'beta',
    name: 'Beta',
    category: 'portfolio',
    formula: 'beta = covariance(asset, market) / market variance',
    plain: 'Measures how much an asset tends to move with the market.',
    use: 'Use in portfolio management to understand market sensitivity and concentration.',
    limit: 'Beta changes over time and can break down in market stress.',
    quickRead: '1 moves like market, >1 more aggressive, <1 calmer.',
    color: 'text-cyan-400',
  },
  {
    id: 'kelly',
    name: 'Kelly Criterion',
    category: 'risk',
    formula: 'f* = (bp - q) / b',
    plain: 'Estimates optimal bet size from win rate and win/loss ratio.',
    use: 'Use as an upper limit, not a default. Many traders use half-Kelly or less.',
    limit: 'Very sensitive to wrong win-rate assumptions.',
    quickRead: 'Good for discipline, dangerous when overtrusted.',
    color: 'text-orange-400',
  },
]

const categories: Array<{ id: 'all' | FormulaCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'risk', label: 'Risk' },
  { id: 'performance', label: 'Performance' },
  { id: 'portfolio', label: 'Portfolio' },
]

export default function QuantReference() {
  const [category, setCategory] = useState<'all' | FormulaCategory>('risk')
  const [selectedId, setSelectedId] = useState('risk-reward')

  const visible = useMemo(
    () => category === 'all' ? formulas : formulas.filter(item => item.category === category),
    [category]
  )
  const selected = formulas.find(item => item.id === selectedId) ?? formulas[0]

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Quant Math Reference</h2>
          <p className="text-xs text-slate-500">Quick formulas with practical trading limits.</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCategory(item.id)
              const next = item.id === 'all' ? formulas[0] : formulas.find(formula => formula.category === item.id)
              if (next) setSelectedId(next.id)
            }}
            className={`flex-shrink-0 rounded px-2.5 py-1 text-xs transition-colors ${
              category === item.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.2fr]">
        <div className="space-y-2">
          {visible.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                selected.id === item.id
                  ? 'border-cyan-500/40 bg-cyan-500/10'
                  : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm font-semibold ${item.color}`}>{item.name}</p>
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">{item.category}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.quickRead}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="mb-3">
            <p className={`text-sm font-semibold ${selected.color}`}>{selected.name}</p>
            <code className="mt-1 block rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200">
              {selected.formula}
            </code>
          </div>

          <div className="space-y-3">
            <InfoBlock label="Plain English" text={selected.plain} />
            <InfoBlock label="Use In This App" text={selected.use} />
            <InfoBlock label="Limit" text={selected.limit} muted />
          </div>

          <div className="mt-4 flex gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
            <p className="text-xs leading-relaxed text-cyan-100">
              Best flow: size the trade first, check the R multiple, then review journal results and backtest metrics later.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoBlock({ label, text, muted }: { label: string; text: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-600">{label}</p>
      <p className={`mt-0.5 text-sm leading-relaxed ${muted ? 'text-slate-500' : 'text-slate-300'}`}>{text}</p>
    </div>
  )
}
