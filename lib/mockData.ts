export interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume: string
  type: 'equity' | 'futures'
}

export const tickers: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 213.45, change: 2.34, changePct: 1.11, volume: '62.4M', type: 'equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: -12.80, changePct: -1.44, volume: '41.2M', type: 'equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.90, change: 5.60, changePct: 2.30, volume: '88.1M', type: 'equity' },
  { symbol: 'SPY', name: 'SPDR S&P 500', price: 523.15, change: 1.85, changePct: 0.36, volume: '54.3M', type: 'equity' },
  { symbol: 'ES1', name: 'E-mini S&P 500', price: 5243.50, change: 18.25, changePct: 0.35, volume: '1.2M', type: 'futures' },
  { symbol: 'NQ1', name: 'E-mini Nasdaq-100', price: 18420.00, change: -45.00, changePct: -0.24, volume: '620K', type: 'futures' },
  { symbol: 'GC1', name: 'Gold Futures', price: 2342.80, change: 12.40, changePct: 0.53, volume: '185K', type: 'futures' },
]

export const extendedTickers: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 213.45, change: 2.34, changePct: 1.11, volume: '62.4M', type: 'equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: -12.80, changePct: -1.44, volume: '41.2M', type: 'equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.90, change: 5.60, changePct: 2.30, volume: '88.1M', type: 'equity' },
  { symbol: 'SPY', name: 'SPDR S&P 500', price: 523.15, change: 1.85, changePct: 0.36, volume: '54.3M', type: 'equity' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.80, change: 3.20, changePct: 0.77, volume: '22.1M', type: 'equity' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 192.30, change: -1.40, changePct: -0.72, volume: '31.5M', type: 'equity' },
  { symbol: 'META', name: 'Meta Platforms', price: 513.60, change: 8.90, changePct: 1.76, volume: '18.3M', type: 'equity' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 171.20, change: -0.80, changePct: -0.47, volume: '24.7M', type: 'equity' },
  { symbol: 'ES1', name: 'E-mini S&P 500', price: 5243.50, change: 18.25, changePct: 0.35, volume: '1.2M', type: 'futures' },
  { symbol: 'NQ1', name: 'E-mini Nasdaq-100', price: 18420.00, change: -45.00, changePct: -0.24, volume: '620K', type: 'futures' },
  { symbol: 'GC1', name: 'Gold Futures', price: 2342.80, change: 12.40, changePct: 0.53, volume: '185K', type: 'futures' },
  { symbol: 'CL1', name: 'Crude Oil WTI', price: 78.45, change: -0.85, changePct: -1.07, volume: '412K', type: 'futures' },
  { symbol: 'ZB1', name: 'US T-Bond 30yr', price: 116.22, change: 0.34, changePct: 0.29, volume: '98K', type: 'futures' },
]

export const ALL_SYMBOLS = extendedTickers.map(t => t.symbol)

// Must only be called inside useEffect (uses Math.random)
export function generateSparkline(basePrice: number, days = 7): number[] {
  const out: number[] = []
  let price = basePrice * 0.97
  for (let i = 0; i < days; i++) {
    price = price + (Math.random() - 0.48) * basePrice * 0.02
    out.push(+price.toFixed(2))
  }
  return out
}

// Generate RSI-like price history (60 days)
export function generatePriceHistory(basePrice: number, days = 60) {
  const data: { date: string; price: number; rsi: number; macd: number; signal: number; histogram: number }[] = []
  let price = basePrice * 0.85
  const prices: number[] = []

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * basePrice * 0.025
    price = Math.max(price + change, basePrice * 0.5)
    prices.push(price)

    const date = new Date(2025, 9, 1)
    date.setDate(date.getDate() + i)

    // RSI calc (simplified)
    let rsi = 50
    if (prices.length >= 14) {
      const recent = prices.slice(-14)
      const gains = recent.filter((_, j) => j > 0 && recent[j] > recent[j - 1]).reduce((s, v, j, a) => s + (j > 0 ? v - a[j-1] : 0), 0)
      const losses = recent.filter((_, j) => j > 0 && recent[j] < recent[j - 1]).reduce((s, v, j, a) => s + (j > 0 ? a[j-1] - v : 0), 0)
      const avgGain = gains / 14
      const avgLoss = losses / 14 || 0.001
      const rs = avgGain / avgLoss
      rsi = 100 - 100 / (1 + rs)
    }

    // MACD (simplified EMA12 - EMA26)
    const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / Math.min(12, prices.length)
    const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / Math.min(26, prices.length)
    const macd = ema12 - ema26
    const signal = macd * 0.85
    const histogram = macd - signal

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: +price.toFixed(2),
      rsi: +rsi.toFixed(1),
      macd: +macd.toFixed(2),
      signal: +signal.toFixed(2),
      histogram: +histogram.toFixed(2),
    })
  }
  return data
}

// Backtest data
export function runBacktest(initialCapital = 100000) {
  let equity = initialCapital
  const equityCurve: { day: number; equity: number; drawdown: number }[] = []
  const trades: { pnl: number; win: boolean }[] = []
  let peak = equity
  let maxDrawdown = 0

  for (let i = 0; i < 252; i++) {
    const inTrade = Math.random() < 0.15
    if (inTrade) {
      const win = Math.random() < 0.56
      const pnl = win
        ? equity * (Math.random() * 0.018 + 0.003)
        : -equity * (Math.random() * 0.012 + 0.002)
      equity += pnl
      trades.push({ pnl, win })
    }

    if (equity > peak) peak = equity
    const drawdown = ((peak - equity) / peak) * 100
    if (drawdown > maxDrawdown) maxDrawdown = drawdown

    equityCurve.push({ day: i + 1, equity: +equity.toFixed(2), drawdown: +drawdown.toFixed(2) })
  }

  const totalReturn = ((equity - initialCapital) / initialCapital) * 100
  const dailyReturns = equityCurve.map((d, i) =>
    i === 0 ? 0 : (d.equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity
  )
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
  const stdDev = Math.sqrt(dailyReturns.map(r => (r - avgReturn) ** 2).reduce((a, b) => a + b, 0) / dailyReturns.length)
  const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0

  return {
    totalReturn: +totalReturn.toFixed(2),
    sharpe: +sharpe.toFixed(2),
    maxDrawdown: +maxDrawdown.toFixed(2),
    winRate: +((trades.filter(t => t.win).length / trades.length) * 100).toFixed(1),
    numTrades: trades.length,
    finalEquity: +equity.toFixed(2),
    equityCurve,
  }
}
