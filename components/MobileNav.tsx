'use client'

import { BarChart2, Activity, Calculator, FlaskConical, BookMarked } from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'signals', label: 'Signals', icon: Activity },
  { id: 'calc', label: 'Calc', icon: Calculator },
  { id: 'backtest', label: 'Backtest', icon: FlaskConical },
  { id: 'journal', label: 'Journal', icon: BookMarked },
]

interface MobileNavProps {
  active: string
  onChange: (id: string) => void
}

export default function MobileNav({ active, onChange }: MobileNavProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1221] border-t border-slate-800 safe-area-inset-bottom">
      <div className="flex">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] transition-colors ${
                isActive ? 'text-blue-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
