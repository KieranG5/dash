import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

type YahooQuote = {
  regularMarketPrice?: number | null
  regularMarketChange?: number | null
  regularMarketChangePercent?: number | null
  regularMarketVolume?: number | null
  regularMarketPreviousClose?: number | null
}

const SYMBOL_MAP: Record<string, string> = {
  // US Equities
  AAPL: 'AAPL', NVDA: 'NVDA', TSLA: 'TSLA', SPY: 'SPY',
  MSFT: 'MSFT', AMZN: 'AMZN', META: 'META', GOOGL: 'GOOGL',
  // CME Futures
  ES1: 'ES=F', NQ1: 'NQ=F', GC1: 'GC=F', CL1: 'CL=F', ZB1: 'ZB=F',
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

export async function GET() {
  try {
    const displaySymbols = Object.keys(SYMBOL_MAP)
    const yahooSymbols = Object.values(SYMBOL_MAP)

    const results = await Promise.allSettled(
      yahooSymbols.map(sym =>
        yf.quote(sym, {}, { validateResult: false }) as Promise<YahooQuote>
      )
    )

    const quotes = displaySymbols.map((displaySym, i) => {
      const result = results[i]
      if (result.status === 'fulfilled' && result.value) {
        const q = result.value
        const price = q.regularMarketPrice ?? 0
        if (price === 0) return null
        return {
          symbol: displaySym,
          price,
          change: q.regularMarketChange ?? 0,
          changePct: q.regularMarketChangePercent ?? 0,
          volume: q.regularMarketVolume ?? 0,
          previousClose: q.regularMarketPreviousClose ?? 0,
        }
      }
      if (result.status === 'rejected') {
        console.error(`[quotes] Failed ${displaySym}:`, result.reason?.message ?? result.reason)
      }
      return null
    }).filter(Boolean)

    return NextResponse.json(
      {
        quotes,
        timestamp: Date.now(),
        received: quotes.length,
        requested: displaySymbols.length,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('Quotes fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}
