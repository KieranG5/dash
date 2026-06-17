export interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  volume: string
  type: 'equity' | 'futures'
  region: 'us' | 'asx' | 'japan' | 'hk'
  currency: 'USD' | 'AUD' | 'JPY' | 'HKD'
}

// Legacy export — kept for backward compat
export const tickers: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 213.45, change: 2.34, changePct: 1.11, volume: '62.4M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: -12.80, changePct: -1.44, volume: '41.2M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.90, change: 5.60, changePct: 2.30, volume: '88.1M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'SPY', name: 'SPDR S&P 500', price: 523.15, change: 1.85, changePct: 0.36, volume: '54.3M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'ES1', name: 'E-mini S&P 500', price: 5243.50, change: 18.25, changePct: 0.35, volume: '1.2M', type: 'futures', region: 'us', currency: 'USD' },
  { symbol: 'NQ1', name: 'E-mini Nasdaq-100', price: 18420.00, change: -45.00, changePct: -0.24, volume: '620K', type: 'futures', region: 'us', currency: 'USD' },
  { symbol: 'GC1', name: 'Gold Futures', price: 2342.80, change: 12.40, changePct: 0.53, volume: '185K', type: 'futures', region: 'us', currency: 'USD' },
]

export const extendedTickers: Ticker[] = [
  // US Equities
  { symbol: 'AAPL', name: 'Apple Inc.', price: 213.45, change: 2.34, changePct: 1.11, volume: '62.4M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: -12.80, changePct: -1.44, volume: '41.2M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.90, change: 5.60, changePct: 2.30, volume: '88.1M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'SPY', name: 'SPDR S&P 500', price: 523.15, change: 1.85, changePct: 0.36, volume: '54.3M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.80, change: 3.20, changePct: 0.77, volume: '22.1M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 192.30, change: -1.40, changePct: -0.72, volume: '31.5M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'META', name: 'Meta Platforms', price: 513.60, change: 8.90, changePct: 1.76, volume: '18.3M', type: 'equity', region: 'us', currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 171.20, change: -0.80, changePct: -0.47, volume: '24.7M', type: 'equity', region: 'us', currency: 'USD' },
  // CME Futures
  { symbol: 'ES1', name: 'E-mini S&P 500', price: 5243.50, change: 18.25, changePct: 0.35, volume: '1.2M', type: 'futures', region: 'us', currency: 'USD' },
  { symbol: 'NQ1', name: 'E-mini Nasdaq-100', price: 18420.00, change: -45.00, changePct: -0.24, volume: '620K', type: 'futures', region: 'us', currency: 'USD' },
  { symbol: 'GC1', name: 'Gold Futures', price: 2342.80, change: 12.40, changePct: 0.53, volume: '185K', type: 'futures', region: 'us', currency: 'USD' },
  { symbol: 'CL1', name: 'Crude Oil WTI', price: 78.45, change: -0.85, changePct: -1.07, volume: '412K', type: 'futures', region: 'us', currency: 'USD' },
  { symbol: 'ZB1', name: 'US T-Bond 30yr', price: 116.22, change: 0.34, changePct: 0.29, volume: '98K', type: 'futures', region: 'us', currency: 'USD' },
  // ASX
  { symbol: 'BHP.AX', name: 'BHP Group', price: 43.20, change: 0.55, changePct: 1.29, volume: '18.2M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'CBA.AX', name: 'Commonwealth Bank', price: 145.30, change: -0.90, changePct: -0.62, volume: '3.4M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'NAB.AX', name: 'Natl Australia Bank', price: 35.80, change: 0.22, changePct: 0.62, volume: '8.1M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'WES.AX', name: 'Wesfarmers', price: 70.55, change: 1.10, changePct: 1.59, volume: '2.8M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'RIO.AX', name: 'Rio Tinto', price: 119.40, change: -1.20, changePct: -1.00, volume: '4.2M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'CSL.AX', name: 'CSL Limited', price: 288.60, change: 3.40, changePct: 1.19, volume: '1.1M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'MQG.AX', name: 'Macquarie Group', price: 214.80, change: -2.30, changePct: -1.06, volume: '0.9M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: 'FMG.AX', name: 'Fortescue Metals', price: 18.95, change: 0.35, changePct: 1.88, volume: '22.4M', type: 'equity', region: 'asx', currency: 'AUD' },
  { symbol: '^AXJO', name: 'ASX 200 Index', price: 8124.50, change: 45.20, changePct: 0.56, volume: '—', type: 'equity', region: 'asx', currency: 'AUD' },
  // Japan
  { symbol: '7203.T', name: 'Toyota Motor', price: 3420, change: -35, changePct: -1.01, volume: '12.3M', type: 'equity', region: 'japan', currency: 'JPY' },
  { symbol: '6758.T', name: 'Sony Group', price: 2810, change: 28, changePct: 1.01, volume: '5.8M', type: 'equity', region: 'japan', currency: 'JPY' },
  { symbol: '9984.T', name: 'SoftBank Group', price: 9540, change: 120, changePct: 1.27, volume: '8.9M', type: 'equity', region: 'japan', currency: 'JPY' },
  { symbol: '6861.T', name: 'Keyence Corp', price: 64800, change: -450, changePct: -0.69, volume: '0.6M', type: 'equity', region: 'japan', currency: 'JPY' },
  { symbol: '^N225', name: 'Nikkei 225', price: 38420, change: 215, changePct: 0.56, volume: '—', type: 'equity', region: 'japan', currency: 'JPY' },
  // Hong Kong / China
  { symbol: '9988.HK', name: 'Alibaba Group', price: 84.90, change: 1.25, changePct: 1.49, volume: '28.4M', type: 'equity', region: 'hk', currency: 'HKD' },
  { symbol: '0700.HK', name: 'Tencent Holdings', price: 392.40, change: -4.60, changePct: -1.16, volume: '14.2M', type: 'equity', region: 'hk', currency: 'HKD' },
  { symbol: '9618.HK', name: 'JD.com Inc.', price: 114.80, change: 2.10, changePct: 1.86, volume: '6.8M', type: 'equity', region: 'hk', currency: 'HKD' },
  { symbol: '^HSI', name: 'Hang Seng Index', price: 21850, change: -180, changePct: -0.82, volume: '—', type: 'equity', region: 'hk', currency: 'HKD' },
]

export const ALL_SYMBOLS = extendedTickers.map(t => t.symbol)

function hashSymbol(symbol: string): number {
  return Array.from(symbol).reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261)
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function generateSparkline(basePrice: number, symbol = 'MARKET', days = 7): number[] {
  const random = seededRandom(hashSymbol(symbol))
  const out: number[] = []
  let price = basePrice * 0.97
  for (let i = 0; i < days; i++) {
    price = price + (random() - 0.48) * basePrice * 0.02
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
export function runBacktest(initialCapital = 100000, seed = 42) {
  const random = seededRandom(seed)
  let equity = initialCapital
  const equityCurve: { day: number; equity: number; drawdown: number }[] = []
  const trades: { pnl: number; win: boolean }[] = []
  let peak = equity
  let maxDrawdown = 0

  for (let i = 0; i < 252; i++) {
    const inTrade = random() < 0.15
    if (inTrade) {
      const win = random() < 0.56
      const pnl = win
        ? equity * (random() * 0.018 + 0.003)
        : -equity * (random() * 0.012 + 0.002)
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
