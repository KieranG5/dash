'use client'

import { useState } from 'react'
import { Calculator, DollarSign } from 'lucide-react'

export default function PositionSizer() {
  const [account, setAccount] = useState('50000')
  const [riskPct, setRiskPct] = useState('1')
  const [entry, setEntry] = useState('150.00')
  const [stop, setStop] = useState('145.00')

  const accountN = parseFloat(account) || 0
  const riskPctN = parseFloat(riskPct) || 0
  const entryN = parseFloat(entry) || 0
  const stopN = parseFloat(stop) || 0

  const maxDollarRisk = (accountN * riskPctN) / 100
  const riskPerShare = Math.abs(entryN - stopN)
  const shares = riskPerShare > 0 ? Math.floor(maxDollarRisk / riskPerShare) : 0
  const positionValue = shares * entryN
  const riskRewardNote = entryN > 0 && riskPerShare > 0

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-purple-400" />
        <h2 className="font-semibold text-white">Position Sizing Calculator</h2>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Never risk more than you can afford to lose on a single trade. This calculator uses the{' '}
        <span className="text-purple-300">fixed fractional method</span> — risk only a small % of your account per trade.
      </p>

      <div className="space-y-3 mb-5">
        <Field
          label="Account Size ($)"
          value={account}
          onChange={setAccount}
          placeholder="50000"
          hint="Total trading capital"
        />
        <Field
          label="Risk Per Trade (%)"
          value={riskPct}
          onChange={setRiskPct}
          placeholder="1"
          hint="Typically 1–2% for professional traders"
        />
        <Field
          label="Entry Price ($)"
          value={entry}
          onChange={setEntry}
          placeholder="150.00"
          hint="Price you plan to buy at"
        />
        <Field
          label="Stop Loss ($)"
          value={stop}
          onChange={setStop}
          placeholder="145.00"
          hint="Price where you'd exit if wrong"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <ResultRow
          label="Max Dollar Risk"
          value={`$${maxDollarRisk.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
          color="text-yellow-400"
          hint={`${riskPctN}% of your $${accountN.toLocaleString()} account`}
        />
        <ResultRow
          label="Shares to Buy"
          value={shares.toLocaleString()}
          color="text-blue-400"
          hint={`Risk per share: $${riskPerShare.toFixed(2)}`}
        />
        <ResultRow
          label="Total Position Value"
          value={`$${positionValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
          color="text-emerald-400"
          hint={`${accountN > 0 ? ((positionValue / accountN) * 100).toFixed(1) : 0}% of account`}
        />
      </div>

      {riskRewardNote && (
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-white font-medium">How this works: </span>
              If ${entry} drops to your stop at ${stop}, you lose ${maxDollarRisk.toFixed(2)} — exactly {riskPctN}% of your account.
              Your downside is capped, letting you stay in the game even if the trade goes wrong.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; hint: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
      />
      <p className="text-xs text-slate-600 mt-0.5">{hint}</p>
    </div>
  )
}

function ResultRow({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-xs text-slate-600">{hint}</p>
      </div>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  )
}
