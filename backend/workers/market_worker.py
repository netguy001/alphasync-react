"""
Market Data Worker — Background price streaming.

Replaces the existing start_price_streaming() in websocket/manager.py
with an event-bus-integrated version. Emits PRICE_UPDATED events that
downstream consumers (WebSocket, Order Worker) subscribe to.
"""

import asyncio
import logging
from typing import Optional

from core.event_bus import event_bus, Event, EventType
from engines.market_session import market_session
from services import market_data

logger = logging.getLogger(__name__)


class MarketDataWorker:
    """
    Fetches live prices and emits them as events.

    Interval adapts to market state:
    - Open:   3 seconds between symbols
    - Closed: 60 seconds (reduced frequency)
    """

    ACTIVE_INTERVAL = 3      # seconds between full sweeps
    IDLE_INTERVAL = 60        # seconds when market closed
    SYMBOL_DELAY = 0.5        # seconds between individual symbol fetches

    def __init__(self):
        self._running = False
        self._subscribed_symbols: set[str] = set()

    def add_symbol(self, symbol: str) -> None:
        """Add a symbol to the streaming set."""
        self._subscribed_symbols.add(symbol)

    def remove_symbol(self, symbol: str) -> None:
        """Remove a symbol from the streaming set."""
        self._subscribed_symbols.discard(symbol)

    def get_symbols(self) -> set[str]:
        """Return currently tracked symbols."""
        return self._subscribed_symbols.copy()

    async def run(self) -> None:
        """Main loop — started via asyncio.create_task in lifespan."""
        self._running = True
        logger.info("Market Data Worker started")

        while self._running:
            try:
                symbols = list(self._subscribed_symbols)
                if symbols:
                    for symbol in symbols:
                        if not self._running:
                            break

                        quote = await market_data.get_quote(symbol)
                        if quote:
                            await event_bus.emit(Event(
                                type=EventType.PRICE_UPDATED,
                                data={
                                    "symbol": symbol,
                                    "quote": quote,
                                },
                                source="market_data_worker",
                            ))

                        await asyncio.sleep(self.SYMBOL_DELAY)

                # Adapt interval to market state
                if market_session.is_trading_hours():
                    await asyncio.sleep(self.ACTIVE_INTERVAL)
                else:
                    await asyncio.sleep(self.IDLE_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Market Data Worker error: {e}", exc_info=True)
                await asyncio.sleep(5)

        logger.info("Market Data Worker stopped")

    async def stop(self) -> None:
        """Gracefully stop the worker."""
        self._running = False


# ── Singleton ──────────────────────────────────────────────────────
market_data_worker = MarketDataWorker()
