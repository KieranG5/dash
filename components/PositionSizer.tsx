'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Calculator, DollarSign, Target } from 'lucide-react'

type Side = 'long' | 'short'

function money(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

function compactMoney(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export default function PositionSizer() {
  const [side, setSide] = useState<Side>('long')
  const [account, setAccount] = useState('50000')
  const [riskPct, setRiskPct] = useState('1')
  const [entry, setEntry] = useState('150.00')
  const [stop, setStop] = useState('145.00')
  const [target, setTarget] = useState('160.00')
  const [maxExposurePct, setMaxExposurePct] = useState('25')

  const values = useMemo(() => {
    const accountN = Number(account) || 0
    const riskPctN = Number(riskPct) || 0
    const entryN = Number(entry) || 0
    const stopN = Number(stop) || 0
    const targetN = Number(target) || 0
    const maxExposurePctN = Number(maxExposurePct) || 0
    const direction = side === 'long' ? 1 : -1
    const validStop = side === 'long' ? stopN < entryN : stopN > entryN
    const validTarget = side === 'long' ? targetN > entryN : targetN < entryN
    const maxDollarRisk = (accountN * riskPctN) / 100
    const riskPerShare = validStop ? Math.abs(entryN - stopN) : 0
    const rewardPerShare = validTarget ? Math.abs(targetN - entryN) : 0
    const riskSizedShares = riskPerShare > 0 ? Math.floor(maxDollarRisk / riskPerShare) : 0
    const exposureCap = accountN * (maxExposurePctN / 100)
    const exposureSizedShares = entryN > 0 ? Math.floor(exposureCap / entryN) : 0
    const shares = Math.max(0, Math.min(riskSizedShares, exposureSizedShares || riskSizedShares))
    const positionValue = shares * entryN
    const actualRisk = shares * riskPerShare
    const potentialReward = shares * rewardPerShare
    const rMultiple = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0
    const stopMovePct = entryN > 0 ? (Math.abs(entryN - stopN) / entryN) * 100 : 0
    const targetMovePct = entryN > 0 ? (Math.abs(targetN - entryN) / entryN) * 100 : 0
    const exposurePct = accountN > 0 ? (positionValue / accountN) * 100 : 0
    const breakEven = entryN
    const expectedPnlAtStop = -actualRisk
    const expectedPnlAtTarget = potentialReward
    const targetDirectionOk = direction * (targetN - entryN) > 0
    const stopDirectionOk = direction * (entryN - stopN) > 0

    return {
      accountN,
      riskPctN,
      entryN,
      stopN,
      targetN,
      maxExposurePctN,
      validStop,
      validTarget,
      maxDollarRisk,
      riskPerShare,
      rewardPerShare,
      shares,
      riskSizedShares,
      exposureSizedShares,
      positionValue,
      actualRisk,
      potentialReward,
      rMultiple,
      stopMovePct,
      targetMovePct,
      exposurePct,
      breakEven,
      expectedPnlAtStop,
      expectedPnlAtTarget,
      targetDirectionOk,
      stopDirectionOk,
    }
  }, [account, entry, maxExposurePct, riskPct, side, stop, target])

  const warnings = [
    values.riskPctN > 2 ? 'Risk per trade is above 2%. That can drain an account quickly during a losing streak.' : null,
    !values.validStop ? `${side === 'long' ? 'Long' : 'Short'} stop is on the wrong side of entry.` : null,
    !values.validTarget ? `${side === 'long' ? 'Long' : 'Short'} target is on the wrong side of entry.` : null,
    values.rMultiple > 0 && values.rMultiple < 1.5 ? 'Reward/risk is below 1.5R. The setup needs a high win rate to work.' : null,
    values.exposurePct > values.maxExposurePctN + 0.01 ? 'Position exposure is above your cap.' : null,
  ].filter(Boolean)

  function changeSide(nextSide: Side) {
    setSide(nextSide)

    const entryN = Number(entry)
    const stopN = Number(stop)
    const targetN = Number(target)
    if (!entryN || !stopN || !targetN) return

    const stopDistance = Math.abs(entryN - stopN)
    const targetDistance = Math.abs(targetN - entryN)
    if (nextSide === 'long') {
      setStop((entryN - stopDistance).toFixed(2))
      setTarget((entryN + targetDistance).toFixed(2))
    } else {
      setStop((entryN + stopDistance).toFixed(2))
      setTarget((entryN - targetDistance).toFixed(2))
    }
  }

  return (
    <section className="bg-[#0d1221] border border-slate-800 rounded-xl p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-2">
            <Calculator className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Position Calculator</h2>
            <p className="text-xs text-slate-500">Risk size, exposure, and reward before entering.</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-slate-800 bg-slate-950/50 p-1">
          {(['long', 'short'] as Side[]).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => changeSide(value)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                side === value ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Field label="Account" value={account} onChange={setAccount} prefix="$" />
        <Field label="Risk" value={riskPct} onChange={setRiskPct} suffix="%" />
        <Field label="Entry" value={entry} onChange={setEntry} prefix="$" />
        <Field label="Stop" value={stop} onChange={setStop} prefix="$" />
        <Field label="Target" value={target} onChange={setTarget} prefix="$" />
        <Field label="Max Exposure" value={maxExposurePct} onChange={setMaxExposurePct} suffix="%" />
      </div>

      <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MainResult label="Shares" value={values.shares.toLocaleString()} hint={`${money(values.riskPerShare)} risk/share`} color="text-blue-400" />
          <MainResult label="Position" value={compactMoney(values.positionValue)} hint={`${values.exposurePct.toFixed(1)}% account exposure`} color="text-emerald-400" />
          <MainResult label="Reward / Risk" value={`${values.rMultiple.toFixed(2)}R`} hint={`${money(values.potentialReward)} target reward`} color={values.rMultiple >= 2 ? 'text-emerald-400' : values.rMultiple >= 1.5 ? 'text-yellow-400' : 'text-red-400'} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
        <ResultRow label="Max Planned Risk" value={money(values.maxDollarRisk)} hint={`${values.riskPctN}% of account`} color="text-yellow-400" />
        <ResultRow label="Actual Trade Risk" value={money(values.actualRisk)} hint={`If stop hits: ${money(values.expectedPnlAtStop)}`} color="text-red-400" />
        <ResultRow label="Target Reward" value={money(values.expectedPnlAtTarget)} hint={`${values.targetMovePct.toFixed(2)}% move from entry`} color="text-emerald-400" />
        <ResultRow label="Stop Distance" value={`${values.stopMovePct.toFixed(2)}%`} hint={`Break-even before fees: ${money(values.breakEven)}`} color="text-slate-200" />
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map(warning => (
            <div key={warning} className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-100">{warning}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-300" />
          <p className="text-xs leading-relaxed text-slate-400">
            <span className="font-medium text-white">Plan: </span>
            {side === 'long' ? 'Buy' : 'Short'} {values.shares.toLocaleString()} shares at {money(values.entryN)}.
            Risk {money(values.actualRisk)} to make about {money(values.potentialReward)}.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600">
        <DollarSign className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <p>Uses fixed-fractional sizing and an exposure cap. It does not model slippage, fees, tax, or gap risk.</p>
      </div>
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
      <span className="mb-1 block text-xs font-medium text-slate-300">{label}</span>
      <span className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/20">
        {prefix && <span className="text-xs text-slate-600">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={event => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none"
        />
        {suffix && <span className="text-xs text-slate-600">{suffix}</span>}
      </span>
    </label>
  )
}

function MainResult({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </div>
  )
}

function ResultRow({ label, value, color, hint }: { label: string; value: string; color: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-mono text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </div>
  )
}
