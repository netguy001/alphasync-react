import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional
import asyncio
import time
import logging
import httpx

from services.nse_stocks import NSE_STOCK_LIST

logger = logging.getLogger(__name__)

# In-memory price cache
_price_cache: dict = {}
_cache_timestamps: dict = {}
CACHE_DURATION = 15  # seconds

# ── Search result cache (Yahoo queries are expensive) ──────────────────────────
_search_cache: dict = {}
_search_cache_ts: dict = {}
SEARCH_CACHE_DURATION = 300  # 5 minutes

# Popular Indian stocks (used for ticker bar, default suggestions)
POPULAR_INDIAN_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE"},
    {"symbol": "INFY.NS", "name": "Infosys", "exchange": "NSE"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "exchange": "NSE"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "exchange": "NSE"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "exchange": "NSE"},
    {"symbol": "ITC.NS", "name": "ITC Limited", "exchange": "NSE"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "exchange": "NSE"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "exchange": "NSE"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "exchange": "NSE"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "exchange": "NSE"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "exchange": "NSE"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "exchange": "NSE"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma", "exchange": "NSE"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "exchange": "NSE"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "exchange": "NSE"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "exchange": "NSE"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "exchange": "NSE"},
]

# Indian market indices
INDIAN_INDICES = [
    {"symbol": "^NSEI", "name": "NIFTY 50"},
    {"symbol": "^BSESN", "name": "SENSEX"},
    {"symbol": "^NSEBANK", "name": "BANK NIFTY"},
    {"symbol": "^CNXIT", "name": "NIFTY IT"},
]


def _format_symbol(symbol: str) -> str:
    """Ensure symbol has .NS suffix for NSE stocks."""
    if not symbol.startswith("^") and not symbol.endswith((".NS", ".BO")):
        return f"{symbol}.NS"
    return symbol


async def get_quote(symbol: str) -> Optional[dict]:
    """Get real-time quote for a symbol."""
    symbol = _format_symbol(symbol)

    # Check cache
    now = time.time()
    if (
        symbol in _price_cache
        and (now - _cache_timestamps.get(symbol, 0)) < CACHE_DURATION
    ):
        return _price_cache[symbol]

    try:
        ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
        info = await asyncio.to_thread(lambda: ticker.info)

        if not info or "regularMarketPrice" not in info:
            # Try fast_info as fallback
            fast = await asyncio.to_thread(lambda: ticker.fast_info)
            quote = {
                "symbol": symbol,
                "name": info.get("shortName", symbol.replace(".NS", "")),
                "price": getattr(fast, "last_price", 0) or 0,
                "change": 0,
                "change_percent": 0,
                "open": getattr(fast, "open", 0) or 0,
                "high": getattr(fast, "day_high", 0) or 0,
                "low": getattr(fast, "day_low", 0) or 0,
                "close": getattr(fast, "previous_close", 0) or 0,
                "volume": getattr(fast, "last_volume", 0) or 0,
                "market_cap": getattr(fast, "market_cap", 0) or 0,
                "exchange": "NSE",
                "timestamp": datetime.utcnow().isoformat(),
            }
        else:
            prev_close = (
                info.get("previousClose", info.get("regularMarketPreviousClose", 0))
                or 0
            )
            current = info.get("regularMarketPrice", info.get("currentPrice", 0)) or 0
            change = current - prev_close if prev_close else 0
            change_pct = (change / prev_close * 100) if prev_close else 0

            quote = {
                "symbol": symbol,
                "name": info.get("shortName", info.get("longName", symbol)),
                "price": current,
                "change": round(change, 2),
                "change_percent": round(change_pct, 2),
                "open": info.get("regularMarketOpen", info.get("open", 0)) or 0,
                "high": info.get("regularMarketDayHigh", info.get("dayHigh", 0)) or 0,
                "low": info.get("regularMarketDayLow", info.get("dayLow", 0)) or 0,
                "close": prev_close,
                "volume": info.get("regularMarketVolume", info.get("volume", 0)) or 0,
                "market_cap": info.get("marketCap", 0) or 0,
                "pe_ratio": info.get("trailingPE", 0) or 0,
                "week_52_high": info.get("fiftyTwoWeekHigh", 0) or 0,
                "week_52_low": info.get("fiftyTwoWeekLow", 0) or 0,
                "exchange": info.get("exchange", "NSE"),
                "timestamp": datetime.utcnow().isoformat(),
            }

        _price_cache[symbol] = quote
        _cache_timestamps[symbol] = now
        return quote

    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        # Return cached data if available
        if symbol in _price_cache:
            return _price_cache[symbol]
        return None


async def get_historical_data(
    symbol: str, period: str = "1mo", interval: str = "1d"
) -> list:
    """Get historical OHLCV data for charts."""
    symbol = _format_symbol(symbol)
    try:
        ticker = await asyncio.to_thread(lambda: yf.Ticker(symbol))
        df = await asyncio.to_thread(
            lambda: ticker.history(period=period, interval=interval)
        )

        if df.empty:
            return []

        candles = []
        for idx, row in df.iterrows():
            candles.append(
                {
                    "time": int(idx.timestamp()),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                }
            )
        return candles
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        return []


async def search_stocks(query: str) -> list:
    """Search for Indian stocks — local DB first, then Yahoo Finance API fallback.

    1. Instant: Search 300+ stocks from local NSE_STOCK_LIST
    2. Async fallback: Hit Yahoo Finance search API for anything else
    3. Merge & deduplicate — return up to 20 results
    """
    query_upper = query.upper().strip()
    if not query_upper:
        return []

    # ── Check search cache ─────────────────────────────────────────────────────
    now = time.time()
    if (
        query_upper in _search_cache
        and (now - _search_cache_ts.get(query_upper, 0)) < SEARCH_CACHE_DURATION
    ):
        return _search_cache[query_upper]

    # ── Step 1: Local search (instant, covers ~300 stocks) ─────────────────────
    local_results = []
    for stock in NSE_STOCK_LIST:
        if (
            query_upper in stock["symbol"].upper()
            or query_upper in stock["name"].upper()
        ):
            local_results.append(stock)

    # ── Step 2: Yahoo Finance search API (covers ALL stocks) ───────────────────
    yahoo_results = await _search_yahoo_finance(query_upper)

    # ── Step 3: Merge & deduplicate ────────────────────────────────────────────
    seen = set()
    merged = []

    # Local results first (more reliable names)
    for r in local_results:
        sym = r["symbol"]
        if sym not in seen:
            seen.add(sym)
            merged.append(r)

    # Then Yahoo results
    for r in yahoo_results:
        sym = r["symbol"]
        if sym not in seen:
            seen.add(sym)
            merged.append(r)

    result = merged[:20]

    # Cache the result
    _search_cache[query_upper] = result
    _search_cache_ts[query_upper] = now

    return result


async def _search_yahoo_finance(query: str) -> list:
    """Hit Yahoo Finance search API. Returns Indian stocks (.NS / .BO)."""
    try:
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        params = {
            "q": query,
            "quotesCount": 15,
            "newsCount": 0,
            "enableFuzzyQuery": True,
            "quotesQueryId": "tss_match_phrase_query",
        }
        headers = {"User-Agent": "Mozilla/5.0"}

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for quote in data.get("quotes", []):
            symbol = quote.get("symbol", "")
            # Only include Indian stocks (NSE / BSE)
            is_indian = symbol.endswith(".NS") or symbol.endswith(".BO")
            is_equity = quote.get("quoteType", "").upper() in ("EQUITY", "ETF")
            if is_indian and is_equity:
                exchange = "NSE" if symbol.endswith(".NS") else "BSE"
                name = quote.get("shortname") or quote.get("longname") or symbol
                results.append({"symbol": symbol, "name": name, "exchange": exchange})
        return results

    except Exception as e:
        logger.warning(f"Yahoo Finance search failed for '{query}': {e}")
        return []


async def get_indices() -> list:
    """Get Indian market indices."""
    indices = []
    for idx_info in INDIAN_INDICES:
        quote = await get_quote(idx_info["symbol"])
        if quote:
            quote["name"] = idx_info["name"]
            indices.append(quote)
    return indices


async def get_ticker_data() -> list:
    """Get indices + all popular stocks for the scrolling ticker bar."""
    items = []
    # Indices first
    for idx_info in INDIAN_INDICES:
        quote = await get_quote(idx_info["symbol"])
        if quote:
            quote["name"] = idx_info["name"]
            quote["kind"] = "index"
            items.append(quote)
    # Then popular stocks
    for stock in POPULAR_INDIAN_STOCKS:
        quote = await get_quote(stock["symbol"])
        if quote:
            quote["name"] = stock["name"]
            quote["kind"] = "stock"
            items.append(quote)
    return items


async def get_batch_quotes(symbols: list[str]) -> dict:
    """Get quotes for multiple symbols."""
    results = {}
    for symbol in symbols:
        quote = await get_quote(symbol)
        if quote:
            results[symbol] = quote
    return results
