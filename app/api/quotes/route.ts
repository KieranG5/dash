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

// Map our display symbols to Yahoo Finance symbols
const SYMBOL_MAP: Record<string, string> = {
  AAPL: 'AAPL',
  NVDA: 'NVDA',
  TSLA: 'TSLA',
  SPY: 'SPY',
  MSFT: 'MSFT',
  AMZN: 'AMZN',
  META: 'META',
  GOOGL: 'GOOGL',
  ES1: 'ES=F',
  NQ1: 'NQ=F',
  GC1: 'GC=F',
  CL1: 'CL=F',
  ZB1: 'ZB=F',
}

export async function GET() {
  try {
    const displaySymbols = Object.keys(SYMBOL_MAP)
    const yahooSymbols = Object.values(SYMBOL_MAP)

    console.log('[/api/quotes] Fetching symbols:', yahooSymbols)

    const results = await Promise.allSettled(
      yahooSymbols.map(sym =>
        yf.quote(sym, {}, { validateResult: false }) as Promise<YahooQuote>
      )
    )

    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error(`[/api/quotes] Failed ${yahooSymbols[i]}:`, r.reason?.message ?? r.reason)
      else console.log(`[/api/quotes] OK ${yahooSymbols[i]}: $${r.value?.regularMarketPrice}`)
    })

    const quotes = displaySymbols.map((displaySym, i) => {
      const result = results[i]
      if (result.status === 'fulfilled' && result.value) {
        const q = result.value
        return {
          symbol: displaySym,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePct: q.regularMarketChangePercent ?? 0,
          volume: q.regularMarketVolume ?? 0,
          previousClose: q.regularMarketPreviousClose ?? 0,
        }
      }
      return null
    }).filter(Boolean)

    return NextResponse.json({ quotes, timestamp: Date.now() })
  } catch (err) {
    console.error('Quotes fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}
