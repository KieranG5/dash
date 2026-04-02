'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

export interface Alert {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  rsi: number
  timestamp: number
}

interface AlertContextType {
  alerts: Alert[]
  todayCount: number
  addAlert: (a: Omit<Alert, 'id' | 'timestamp'>) => void
  removeAlert: (id: string) => void
}

const AlertContext = createContext<AlertContextType>({
  alerts: [],
  todayCount: 0,
  addAlert: () => {},
  removeAlert: () => {},
})

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const recentRef = useRef<Map<string, number>>(new Map())

  const addAlert = useCallback((a: Omit<Alert, 'id' | 'timestamp'>) => {
    const key = `${a.symbol}-${a.type}`
    const last = recentRef.current.get(key) ?? 0
    if (Date.now() - last < 60_000) return // debounce per symbol per minute

    recentRef.current.set(key, Date.now())
    const id = `${key}-${Date.now()}`
    setAlerts(prev => [...prev, { ...a, id, timestamp: Date.now() }])
    setTodayCount(c => c + 1)

    setTimeout(() => {
      setAlerts(prev => prev.filter(x => x.id !== id))
    }, 6000)
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(x => x.id !== id))
  }, [])

  return (
    <AlertContext.Provider value={{ alerts, todayCount, addAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  )
}

export const useAlerts = () => useContext(AlertContext)
