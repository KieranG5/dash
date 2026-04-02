'use client'

import { useState } from 'react'
import { BookMarked, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

interface Trade {
  id: string
  ticker: string
  entry: number
  exit: number
  shares: number
  notes: string
  date: string
}

const sampleTrades: Trade[] = [
  { id: '1', ticker: 'AAPL', entry: 210.00, exit: 218.50, shares: 50, notes: 'RSI bounce from 28, held 3 days', date: '2025-10-14' },
  { id: '2', ticker: 'NVDA', entry: 890.00, exit: 875.00, shares: 10, notes: 'Missed the breakdown signal, cut quickly', date: '2025-10-18' },
  { id: '3', ticker: 'SPY', entry: 518.00, exit: 524.20, shares: 20, notes: 'FOMC day gap fill — textbook setup', date: '2025-10-22' },
]

export default function TradingJournal() {
  const [trades, setTrades] = useState<Trade[]>(sampleTrades)
  const [form, setForm] = useState({ ticker: '', entry: '', exit: '', shares: '', notes: '' })
  const [adding, setAdding] = useState(false)

  const totalPnL = trades.reduce((sum, t) => sum + (t.exit - t.entry) * t.shares, 0)

  function addTrade() {
    if (!form.ticker || !form.entry || !form.exit || !form.shares) return
    const trade: Trade = {
      id: Date.now().toString(),
      ticker: form.ticker.toUpperCase(),
      entry: parseFloat(form.entry),
      exit: parseFloat(form.exit),
      shares: parseInt(form.shares),
      notes: form.notes,
      date: new Date().toISOString().split('T')[0],
    }
    setTrades([trade, ...trades])
    setForm({ ticker: '', entry: '', exit: '', shares: '', notes: '' })
    setAdding(false)
  }

  function deleteTrade(id: string) {
    setTrades(trades.filter(t => t.id !== id))
  }

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-pink-400" />
          <h2 className="font-semibold text-white">Paper Trading Journal</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold font-mono ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} P&amp;L
          </span>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1 px-3 py-1 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 text-xs font-medium rounded-lg border border-pink-600/30 transition-all"
          >
            <Plus className="w-3 h-3" /> Log Trade
          </button>
        </div>
      </div>

      {/* Add trade form */}
      {adding && (
        <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Ticker (e.g. AAPL)" value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all" />
            <input type="number" placeholder="Shares" value={form.shares} onChange={e => setForm({ ...form, shares: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all" />
            <input type="number" placeholder="Entry price" value={form.entry} onChange={e => setForm({ ...form, entry: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all" />
            <input type="number" placeholder="Exit price" value={form.exit} onChange={e => setForm({ ...form, exit: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all" />
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-all" />
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

      {/* Trade list */}
      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
        {trades.map(t => {
          const pnl = (t.exit - t.entry) * t.shares
          const pnlPct = ((t.exit - t.entry) / t.entry) * 100
          const win = pnl >= 0
          return (
            <div key={t.id} className={`p-3 rounded-lg border ${win ? 'border-emerald-900/50 bg-emerald-900/10' : 'border-red-900/50 bg-red-900/10'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {win ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                  <span className="font-bold text-white text-sm">{t.ticker}</span>
                  <span className="text-xs text-slate-500">{t.shares} shares</span>
                  <span className="text-xs text-slate-600">{t.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm font-mono ${win ? 'text-emerald-400' : 'text-red-400'}`}>
                    {win ? '+' : ''}${pnl.toFixed(2)}{' '}
                    <span className="text-xs font-normal">({win ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                  </span>
                  <button onClick={() => deleteTrade(t.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1 ml-5">
                <span className="text-xs text-slate-500">Entry: <span className="text-slate-300">${t.entry}</span></span>
                <span className="text-xs text-slate-500">Exit: <span className="text-slate-300">${t.exit}</span></span>
              </div>
              {t.notes && <p className="text-xs text-slate-500 mt-1.5 ml-5 italic">&ldquo;{t.notes}&rdquo;</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
