'use client'

import { useState } from 'react'
import { AlertProvider, useAlerts } from '@/context/AlertContext'
import MarketOverview from '@/components/MarketOverview'
import IndicatorPanel from '@/components/IndicatorPanel'
import PositionSizer from '@/components/PositionSizer'
import BacktestSimulator from '@/components/BacktestSimulator'
import QuantReference from '@/components/QuantReference'
import TradingJournal from '@/components/TradingJournal'
import NewsPanel from '@/components/NewsPanel'
import ToastContainer from '@/components/ToastContainer'
import MobileNav from '@/components/MobileNav'
import WorldClock from '@/components/WorldClock'
import { BarChart2, Bell } from 'lucide-react'

function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [mobileTab, setMobileTab] = useState('overview')
  const [isLive, setIsLive] = useState<boolean | null>(null)
  const { todayCount } = useAlerts()

  // Show a section on desktop always; on mobile only when tab matches
  const show = (tabId: string) => ({
    className: mobileTab === tabId ? 'block' : 'hidden sm:block',
  })

  return (
    <div className="min-h-screen bg-[#0a0e1a] pb-16 sm:pb-0">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0d1221] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">QuantDash</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5 hidden sm:block">
                Professional Trading Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live / Offline badge */}
            {isLive === true && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </span>
            )}
            {isLive === false && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/20">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                Offline
              </span>
            )}

            {/* Bell with alert count */}
            <div className="relative p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-400" />
              {todayCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                  {todayCount > 99 ? '99+' : todayCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* World Clock — always visible */}
        <WorldClock />

        {/* Market Overview — always visible on desktop; mobile: 'overview' tab */}
        <div {...show('overview')}>
          <MarketOverview
            onSelectSymbol={sym => { setSelectedSymbol(sym); setMobileTab('signals') }}
            selectedSymbol={selectedSymbol}
            onLiveStatus={setIsLive}
          />
        </div>

        {/* Signals + Calculator row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div {...show('signals')}>
            <IndicatorPanel symbol={selectedSymbol} />
          </div>
          <div {...show('calc')}>
            <PositionSizer />
          </div>
        </div>

        {/* Backtest */}
        <div {...show('backtest')}>
          <BacktestSimulator />
        </div>

        {/* Reference + Journal row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* QuantReference hidden on mobile (not in mobile nav) */}
          <div className="hidden sm:block">
            <QuantReference />
          </div>
          <div {...show('journal')}>
            <TradingJournal />
          </div>
        </div>

        {/* News — on desktop always; on mobile under 'overview' tab at bottom */}
        <div className="hidden sm:block">
          <NewsPanel />
        </div>
        <div className={mobileTab === 'overview' ? 'block sm:hidden' : 'hidden'}>
          <NewsPanel />
        </div>
      </main>

      <footer className="hidden sm:block text-center text-xs text-slate-600 py-6 border-t border-slate-800 mt-6">
        QuantDash — For educational and simulation purposes only. Not financial advice.
      </footer>

      <MobileNav active={mobileTab} onChange={setMobileTab} />
      <ToastContainer />
    </div>
  )
}

export default function Home() {
  return (
    <AlertProvider>
      <Dashboard />
    </AlertProvider>
  )
}
