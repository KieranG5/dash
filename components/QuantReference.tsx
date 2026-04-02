'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'

const formulas = [
  {
    name: 'Sharpe Ratio',
    formula: 'S = (Rp − Rf) / σp',
    color: 'text-blue-400',
    badge: 'bg-blue-400/10 border-blue-400/20',
    explanation: 'Measures return per unit of risk. Above 1.0 is good; above 2.0 is excellent. If your strategy earns 15% with low volatility, it has a high Sharpe. A strategy earning 20% with wild swings might have a lower Sharpe than one earning 12% steadily.',
    vars: [
      { sym: 'Rp', def: 'Portfolio return' },
      { sym: 'Rf', def: 'Risk-free rate (e.g. T-bills ~5%)' },
      { sym: 'σp', def: 'Std deviation of portfolio returns' },
    ],
  },
  {
    name: 'Alpha (α)',
    formula: 'α = Rp − [Rf + β(Rm − Rf)]',
    color: 'text-emerald-400',
    badge: 'bg-emerald-400/10 border-emerald-400/20',
    explanation: "Alpha is your 'edge' — the return above what the market would predict. Positive alpha means you outperformed. Negative alpha means the market beat you after adjusting for risk. Most active managers have zero or negative alpha after fees.",
    vars: [
      { sym: 'Rp', def: 'Your portfolio return' },
      { sym: 'Rm', def: 'Market return (e.g. S&P 500)' },
      { sym: 'β', def: 'Beta (how much you move with the market)' },
      { sym: 'Rf', def: 'Risk-free rate' },
    ],
  },
  {
    name: 'Beta (β)',
    formula: 'β = Cov(Rp, Rm) / Var(Rm)',
    color: 'text-purple-400',
    badge: 'bg-purple-400/10 border-purple-400/20',
    explanation: "Beta measures how your portfolio moves relative to the market. β=1 means you move in lockstep with the S&P 500. β=1.5 means you're 50% more volatile. β=0.5 means you're half as volatile. Tech stocks often have β>1; utilities often have β<1.",
    vars: [
      { sym: 'Cov(Rp,Rm)', def: 'Covariance of portfolio vs market returns' },
      { sym: 'Var(Rm)', def: 'Variance of market returns' },
    ],
  },
  {
    name: 'Kelly Criterion',
    formula: 'f* = (bp − q) / b',
    color: 'text-orange-400',
    badge: 'bg-orange-400/10 border-orange-400/20',
    explanation: "Kelly tells you the optimal % of capital to bet on each trade to maximise long-term growth without going broke. Most traders use half-Kelly (f*/2) to reduce volatility. Example: 55% win rate, 1:1 R/R → f* = 10% of account per trade.",
    vars: [
      { sym: 'b', def: 'Net odds (profit/loss ratio, e.g. 1.0 for 1:1 R:R)' },
      { sym: 'p', def: 'Probability of winning (e.g. 0.55)' },
      { sym: 'q', def: '1 − p (probability of losing)' },
    ],
  },
]

export default function QuantReference() {
  const [open, setOpen] = useState<string | null>('Sharpe Ratio')

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <h2 className="font-semibold text-white">Quant Math Reference</h2>
      </div>

      <div className="space-y-2">
        {formulas.map(f => (
          <div key={f.name} className="border border-slate-800 rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-all text-left"
              onClick={() => setOpen(open === f.name ? null : f.name)}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${f.badge} ${f.color}`}>{f.name}</span>
                <code className={`font-mono text-sm ${f.color}`}>{f.formula}</code>
              </div>
              <span className={`text-slate-500 text-lg transition-transform ${open === f.name ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === f.name && (
              <div className="px-4 pb-4 bg-slate-900/30">
                <p className="text-sm text-slate-300 leading-relaxed mb-3">{f.explanation}</p>
                <div className="space-y-1">
                  {f.vars.map(v => (
                    <div key={v.sym} className="flex items-start gap-2">
                      <code className={`text-xs font-mono font-bold ${f.color} min-w-[80px]`}>{v.sym}</code>
                      <span className="text-xs text-slate-400">{v.def}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
