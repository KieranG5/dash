'use client'

import { useAlerts } from '@/context/AlertContext'
import { TrendingUp, TrendingDown, X } from 'lucide-react'

export default function ToastContainer() {
  const { alerts, removeAlert } = useAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {alerts.map(a => (
        <div
          key={a.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm min-w-[260px] max-w-[320px] animate-slide-in ${
            a.type === 'BUY'
              ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'
              : 'bg-red-950/90 border-red-700/60 text-red-100'
          }`}
        >
          {a.type === 'BUY'
            ? <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            : <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          }
          <div className="flex-1 text-xs leading-relaxed">
            <span className="font-bold">{a.symbol}</span> RSI{' '}
            {a.type === 'BUY' ? 'oversold' : 'overbought'} at{' '}
            <span className="font-mono font-bold">{a.rsi.toFixed(1)}</span>
            <br />
            <span className={a.type === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>
              — potential {a.type}
            </span>
          </div>
          <button
            onClick={() => removeAlert(a.id)}
            className="text-white/40 hover:text-white/80 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
