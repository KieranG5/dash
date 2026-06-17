import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { ALL_SYMBOLS, extendedTickers } from '@/lib/mockData'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

type YahooNewsItem = {
  uuid?: string
  title?: string
  publisher?: string
  link?: string
  providerPublishTime?: string | number | Date
  relatedTickers?: string[]
  thumbnail?: {
    resolutions?: Array<{
      url?: string
      width?: number
      height?: number
    }>
  }
}

type YahooSearchResponse = {
  news?: YahooNewsItem[]
}

const POSITIVE = [
  'beats', 'beat', 'surge', 'surges', 'rally', 'rises', 'gain', 'gains', 'record',
  'upgrade', 'upgraded', 'bullish', 'outperform', 'growth', 'profit', 'strong',
  'raises', 'higher', 'accelerates', 'approval', 'buyback',
]

const NEGATIVE = [
  'miss', 'misses', 'falls', 'fall', 'slides', 'drops', 'drop', 'cuts', 'cut',
  'downgrade', 'downgraded', 'bearish', 'underperform', 'loss', 'weak', 'slows',
  'concern', 'lawsuit', 'probe', 'warning', 'decline', 'lower',
]

function sentimentFor(text: string) {
  const lower = text.toLowerCase()
  const positiveHits = POSITIVE.filter(word => lower.includes(word)).length
  const negativeHits = NEGATIVE.filter(word => lower.includes(word)).length
  const rawScore = positiveHits - negativeHits
  const score = Math.max(-1, Math.min(1, rawScore / 3))
  const label = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral'
  return { label, score: +score.toFixed(2) }
}

function toTimestamp(value: YahooNewsItem['providerPublishTime']): number {
  if (!value) return Date.now()
  if (typeof value === 'number') return value > 10_000_000_000 ? value : value * 1000
  return new Date(value).getTime()
}

function findRelatedSymbols(item: YahooNewsItem, requestedSymbol: string) {
  const title = item.title ?? ''
  const related = new Set<string>()

  for (const symbol of item.relatedTickers ?? []) {
    if (ALL_SYMBOLS.includes(symbol)) related.add(symbol)
  }

  if (ALL_SYMBOLS.includes(requestedSymbol)) related.add(requestedSymbol)

  for (const ticker of extendedTickers) {
    const companyWords = ticker.name.split(/\s+/).filter(word => word.length > 4)
    const titleUpper = title.toUpperCase()
    if (titleUpper.includes(ticker.symbol) || companyWords.some(word => title.toLowerCase().includes(word.toLowerCase()))) {
      related.add(ticker.symbol)
    }
  }

  return Array.from(related).slice(0, 5)
}

function thumbnailFor(item: YahooNewsItem) {
  const resolutions = item.thumbnail?.resolutions ?? []
  const image = resolutions.find(resolution => resolution.url && (resolution.width ?? 0) >= 140) ?? resolutions[0]
  return image?.url ?? null
}

function normalizeItem(item: YahooNewsItem, requestedSymbol: string) {
  const headline = item.title?.trim()
  const url = item.link?.trim()
  if (!headline || !url) return null

  const publishedAt = toTimestamp(item.providerPublishTime)
  const relatedSymbols = findRelatedSymbols(item, requestedSymbol)
  const sentiment = sentimentFor(headline)
  const mentionsRequested = relatedSymbols.includes(requestedSymbol) || headline.toUpperCase().includes(requestedSymbol)
  const relevance = mentionsRequested ? 100 : Math.max(35, 75 - relatedSymbols.length * 5)

  return {
    id: item.uuid ?? url,
    headline,
    source: item.publisher ?? 'Yahoo Finance',
    url,
    symbols: relatedSymbols,
    publishedAt,
    ageMinutes: Math.max(0, Math.floor((Date.now() - publishedAt) / 60_000)),
    sentiment: sentiment.label,
    sentimentScore: sentiment.score,
    relevance,
    image: thumbnailFor(item),
  }
}

type NormalizedNewsItem = NonNullable<ReturnType<typeof normalizeItem>>

function isNewsItem(item: ReturnType<typeof normalizeItem>): item is NormalizedNewsItem {
  return item !== null
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const symbol = (url.searchParams.get('symbol') ?? 'AAPL').toUpperCase()
  const query = url.searchParams.get('q')?.trim()
  const searchTerm = query || symbol

  try {
    const response = await yf.search(
      searchTerm,
      {
        newsCount: 18,
        quotesCount: 0,
      },
      { validateResult: false }
    ) as YahooSearchResponse

    const seen = new Set<string>()
    const news = (response.news ?? [])
      .map(item => normalizeItem(item, symbol))
      .filter(isNewsItem)
      .filter(item => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 15)

    if (news.length === 0) {
      return NextResponse.json({ error: 'No news found', news: [] }, { status: 404 })
    }

    const sentimentCounts = news.reduce(
      (counts, item) => {
        counts[item.sentiment as keyof typeof counts] += 1
        return counts
      },
      { positive: 0, neutral: 0, negative: 0 }
    )
    const averageSentiment = news.reduce((sum, item) => sum + item.sentimentScore, 0) / news.length

    return NextResponse.json(
      {
        news,
        source: 'Yahoo Finance',
        symbol,
        query: searchTerm,
        timestamp: Date.now(),
        summary: {
          count: news.length,
          sentimentCounts,
          averageSentiment: +averageSentiment.toFixed(2),
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch news', news: [] }, { status: 500 })
  }
}
