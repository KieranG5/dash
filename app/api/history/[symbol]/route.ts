import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

type HistoricalRow = { date: Date; close?: number | null }

const SYMBOL_MAP: Record<string, string> = {
  // US
  AAPL: 'AAPL', NVDA: 'NVDA', TSLA: 'TSLA', SPY: 'SPY',
  MSFT: 'MSFT', AMZN: 'AMZN', META: 'META', GOOGL: 'GOOGL',
  ES1: 'ES=F', NQ1: 'NQ=F', GC1: 'GC=F', CL1: 'CL=F',
  ZB1: 'ZB=F',
  // ASX
  'BHP.AX': 'BHP.AX', 'CBA.AX': 'CBA.AX', 'NAB.AX': 'NAB.AX',
  'WES.AX': 'WES.AX', 'RIO.AX': 'RIO.AX', 'CSL.AX': 'CSL.AX',
  'MQG.AX': 'MQG.AX', 'FMG.AX': 'FMG.AX', '^AXJO': '^AXJO',
  // Japan
  '7203.T': '7203.T', '6758.T': '6758.T', '9984.T': '9984.T',
  '6861.T': '6861.T', '^N225': '^N225',
  // HK
  '9988.HK': '9988.HK', '0700.HK': '0700.HK',
  '9618.HK': '9618.HK', '^HSI': '^HSI',
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  const recent = closes.slice(-period - 1)
  let gains = 0, losses = 0
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1]
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }
  const avgGain = gains / period
  const avgLoss = losses / period || 0.001
  const rs = avgGain / avgLoss
  return +(100 - 100 / (1 + rs)).toFixed(1)
}

function calcEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = [prices[0]]
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k))
  }
  return ema
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const yahooSym = SYMBOL_MAP[symbol]
  if (!yahooSym) {
    return NextResponse.json({ error: 'Unknown symbol' }, { status: 400 })
  }

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90) // 90 days for indicator warmup

    const historical = await yf.historical(yahooSym, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d',
    }, { validateResult: false }) as HistoricalRow[]

    if (!historical || historical.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    const sorted = [...historical].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const closes = sorted.map(d => d.close ?? 0)

    // Calculate EMAs for MACD
    const ema12 = calcEMA(closes, 12)
    const ema26 = calcEMA(closes, 26)

    // Build output for last 60 days
    const output = sorted.slice(-60).map((d, i, arr) => {
      const globalIdx = sorted.length - 60 + i
      const closesUpToHere = closes.slice(0, globalIdx + 1)
      const rsi = calcRSI(closesUpToHere)

      const macdLine = ema12[globalIdx] - ema26[globalIdx]
      const recentMacd = sorted.slice(Math.max(0, globalIdx - 9), globalIdx + 1).map((_, j) => {
        const gi = Math.max(0, globalIdx - 9) + j
        return ema12[gi] - ema26[gi]
      })
      const signal = recentMacd.reduce((a, b) => a + b, 0) / recentMacd.length
      const histogram = macdLine - signal

      return {
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: +(d.close ?? 0).toFixed(2),
        rsi,
        macd: +macdLine.toFixed(2),
        signal: +signal.toFixed(2),
        histogram: +histogram.toFixed(2),
      }
    })

    // Sparkline: last 7 closes
    const sparkline = sorted.slice(-7).map(d => +(d.close ?? 0).toFixed(2))

    return NextResponse.json({ data: output, sparkline, timestamp: Date.now() })
  } catch (err) {
    console.error(`History fetch error for ${symbol}:`, err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
