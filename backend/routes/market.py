from fastapi import APIRouter, Query
from services import market_data

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    quote = await market_data.get_quote(symbol)
    if not quote:
        return {"error": "Symbol not found or data unavailable"}
    return quote


@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    results = await market_data.search_stocks(q)
    return {"results": results}


@router.get("/history/{symbol}")
async def get_history(
    symbol: str,
    period: str = Query("1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|max)$"),
    interval: str = Query("1d", regex="^(1m|5m|15m|30m|1h|1d|1wk|1mo)$"),
):
    data = await market_data.get_historical_data(symbol, period, interval)
    return {"symbol": symbol, "candles": data, "count": len(data)}


@router.get("/indices")
async def get_indices():
    indices = await market_data.get_indices()
    return {"indices": indices}


@router.get("/ticker")
async def get_ticker():
    """All indices + popular stocks for the scrolling ticker bar."""
    items = await market_data.get_ticker_data()
    return {"items": items}


@router.get("/popular")
async def get_popular_stocks():
    return {"stocks": market_data.POPULAR_INDIAN_STOCKS}


@router.get("/batch")
async def batch_quotes(
    symbols: str = Query(..., description="Comma-separated symbols")
):
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    quotes = await market_data.get_batch_quotes(symbol_list)
    return {"quotes": quotes}
