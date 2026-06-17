'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CLOCKS = [
  { city: 'Sydney', tz: 'Australia/Sydney', flag: '🇦🇺' },
  { city: 'Tokyo', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { city: 'Hong Kong', tz: 'Asia/Hong_Kong', flag: '🇭🇰' },
  { city: 'London', tz: 'Europe/London', flag: '🇬🇧' },
  { city: 'New York', tz: 'America/New_York', flag: '🇺🇸' },
]

function formatTime(tz: string, now: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
}

function formatDay(tz: string, now: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    weekday: 'short',
  }).format(now)
}

export default function WorldClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const frame = requestAnimationFrame(tick)
    const interval = setInterval(tick, 1000)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(interval)
    }
  }, [])

  if (!now) return null

  return (
    <div className="bg-[#0d1221] border border-slate-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">World Clock</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {CLOCKS.map(({ city, tz, flag }) => (
          <div key={city} className="text-center">
            <p className="text-xs text-slate-500 mb-0.5">{flag} {city}</p>
            <p className="font-mono font-bold text-white text-sm tabular-nums">
              {formatTime(tz, now)}
            </p>
            <p className="text-xs text-slate-600">{formatDay(tz, now)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
