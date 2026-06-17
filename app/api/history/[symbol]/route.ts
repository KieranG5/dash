import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

type HistoricalRow = {
  date: Date
  open?: number | null
  high?: number | null
  low?: number | null
  close?: number | null
  volume?: number | null
}

type ChartResponse = {
  meta?: {
    exchangeTimezoneName?: string
    regularMarketPrice?: number | null
    regularMarketTime?: Date | string
  }
  quotes?: HistoricalRow[]
}

type NormalizedRow = HistoricalRow & {
  close: number
  isPartial?: boolean
}

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

function normalizeRows(rows: HistoricalRow[], regularMarketPrice?: number | null): NormalizedRow[] {
  const lastIndex = rows.length - 1
  return rows.flatMap((row, index) => {
    if (typeof row.close === 'number' && row.close > 0) {
      return [{ ...row, close: row.close }]
    }

    const canUseLivePrice =
      index === lastIndex &&
      typeof regularMarketPrice === 'number' &&
      regularMarketPrice > 0 &&
      typeof row.open === 'number'

    if (!canUseLivePrice) return []

    return [{
      ...row,
      close: regularMarketPrice,
      high: Math.max(row.high ?? regularMarketPrice, regularMarketPrice),
      low: Math.min(row.low ?? regularMarketPrice, regularMarketPrice),
      isPartial: true,
    }]
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const yahooSym = SYMBOL_MAP[symbol]
  if (!yahooSym) {
    return NextResponse.json({ error: 'Unknown symbol' }, { status: 400 })
  }

  try {
    const url = new URL(req.url)
    const range = url.searchParams.get('range') ?? '3M'
    const daysByRange: Record<string, number> = {
      '1D': 7,
      '1M': 45,
      '3M': 120,
      '6M': 210,
      '1Y': 420,
    }
    const outputDaysByRange: Record<string, number> = {
      '1D': 96,
      '1M': 22,
      '3M': 66,
      '6M': 132,
      '1Y': 252,
    }
    const historyDays = daysByRange[range] ?? daysByRange['3M']
    const outputDays = outputDaysByRange[range] ?? outputDaysByRange['3M']

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - historyDays)

    const chart = await yf.chart(yahooSym, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: range === '1D' ? '5m' : '1d',
    }, { validateResult: false }) as ChartResponse
    const historical = chart.quotes ?? []

    if (!historical || historical.length === 0) {
      return NextResponse.json({ error: 'No data' }, { status: 404 })
    }

    const sorted = [...historical].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const intradayTimeZone = chart.meta?.exchangeTimezoneName ?? 'America/New_York'
    const latestSession = range === '1D' && sorted.length > 0
      ? new Intl.DateTimeFormat('en-CA', {
          timeZone: intradayTimeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(sorted[sorted.length - 1].date))
      : null
    const sessionRows = latestSession
      ? sorted.filter(row => new Intl.DateTimeFormat('en-CA', {
          timeZone: intradayTimeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(row.date)) === latestSession)
      : sorted
    const validRows = normalizeRows(sessionRows, chart.meta?.regularMarketPrice)
    const closes = validRows.map(d => d.close)
    if (closes.length < 2) {
      return NextResponse.json({ error: 'Insufficient data' }, { status: 404 })
    }

    // Calculate EMAs for MACD
    const ema12 = calcEMA(closes, 12)
    const ema26 = calcEMA(closes, 26)

    const outputStart = Math.max(0, validRows.length - outputDays)
    const output = validRows.slice(outputStart).map((d, i) => {
      const globalIdx = outputStart + i
      const closesUpToHere = closes.slice(0, globalIdx + 1)
      const rsi = calcRSI(closesUpToHere)

      const macdLine = ema12[globalIdx] - ema26[globalIdx]
      const recentMacd = validRows.slice(Math.max(0, globalIdx - 9), globalIdx + 1).map((_, j) => {
        const gi = Math.max(0, globalIdx - 9) + j
        return ema12[gi] - ema26[gi]
      })
      const signal = recentMacd.reduce((a, b) => a + b, 0) / recentMacd.length
      const histogram = macdLine - signal

      return {
        isoDate: new Date(d.date).toISOString().split('T')[0],
        date: range === '1D'
          ? new Date(d.date).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: intradayTimeZone,
            })
          : new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open: +(d.open ?? d.close ?? 0).toFixed(2),
        high: +(d.high ?? d.close ?? 0).toFixed(2),
        low: +(d.low ?? d.close ?? 0).toFixed(2),
        close: +(d.close ?? 0).toFixed(2),
        price: +(d.close ?? 0).toFixed(2),
        volume: d.volume ?? 0,
        isPartial: d.isPartial ?? false,
        rsi,
        macd: +macdLine.toFixed(2),
        signal: +signal.toFixed(2),
        histogram: +histogram.toFixed(2),
      }
    })

    // Sparkline: last 7 closes
    const sparkline = validRows.slice(-7).map(d => +(d.close as number).toFixed(2))

    return NextResponse.json(
      {
        data: output,
        sparkline,
        range,
        source: 'Yahoo Finance',
        timestamp: Date.now(),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error(`History fetch error for ${symbol}:`, err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
