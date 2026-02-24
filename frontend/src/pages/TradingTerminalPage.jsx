// ─── TradingTerminalPage — refactored ────────────────────────────────────────
// Layout: [Watchlist 260px] | [Chart + BottomTabs flex-1] | [OrderPanel 300px]
// All data logic delegated to useMarketData, usePortfolioStore, and Zustand.
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketData } from '../hooks/useMarketData';
import TradingChart from '../components/trading/TradingChart';
import Watchlist from '../components/trading/Watchlist';
import OrderPanel from '../components/trading/OrderPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import { cn } from '../utils/cn';
import { formatPrice, formatPercent, pnlColorClass } from '../utils/formatters';
import { CHART_PERIODS, DEFAULT_CHART_PERIOD, ORDER_STATUS_CLASS, DEFAULT_WATCHLIST_SYMBOLS } from '../utils/constants';
import api from '../services/api';

// ── Bottom tabs: positions + order history ────────────────────────────────────
function BottomTabs({ holdings, orders }) {
    const [activeTab, setActiveTab] = useState('positions');
    return (
        <div className="h-[200px] border-t border-edge/5 flex-shrink-0 flex flex-col bg-surface-900/20">
            <div className="flex border-b border-edge/5 flex-shrink-0">
                {[
                    { key: 'positions', label: `Positions (${holdings.length})` },
                    { key: 'orders', label: `Orders (${orders.length})` },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={cn(
                            'px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                            activeTab === key
                                ? 'text-primary-400 border-b-2 border-primary-500'
                                : 'text-gray-500 hover:text-gray-300'
                        )}>
                        {label}
                    </button>
                ))}
            </div>
            <div className="overflow-y-auto flex-1 px-3 py-2">
                {activeTab === 'positions' ? (
                    holdings.length > 0 ? (
                        <table className="w-full text-xs min-w-[500px]">
                            <thead>
                                <tr className="text-gray-500 uppercase">
                                    <th className="text-left pb-2 font-medium">Symbol</th>
                                    <th className="text-right pb-2 font-medium">Qty</th>
                                    <th className="text-right pb-2 font-medium">Avg</th>
                                    <th className="text-right pb-2 font-medium">LTP</th>
                                    <th className="text-right pb-2 font-medium">P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => (
                                    <tr key={h.symbol || i} className="border-t border-edge/[0.02]">
                                        <td className="py-1.5 font-semibold text-heading">{h.symbol?.replace('.NS', '')}</td>
                                        <td className="py-1.5 text-right font-mono text-gray-300">{h.quantity}</td>
                                        <td className="py-1.5 text-right font-mono text-gray-300">{formatPrice(h.avg_price)}</td>
                                        <td className="py-1.5 text-right font-mono text-heading">{formatPrice(h.current_price)}</td>
                                        <td className={cn('py-1.5 text-right font-mono font-semibold', pnlColorClass(h.pnl ?? 0))}>
                                            {(h.pnl ?? 0) >= 0 ? '+' : ''}₹{formatPrice(h.pnl ?? 0)}{' '}
                                            ({formatPercent(h.pnl_percent ?? 0)})
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-6 text-gray-600 text-xs">No open positions. Place a trade to get started.</div>
                    )
                ) : (
                    orders.length > 0 ? (
                        <table className="w-full text-xs min-w-[600px]">
                            <thead>
                                <tr className="text-gray-500 uppercase">
                                    <th className="text-left pb-2 font-medium">Symbol</th>
                                    <th className="text-left pb-2 font-medium">Side</th>
                                    <th className="text-left pb-2 font-medium">Type</th>
                                    <th className="text-right pb-2 font-medium">Qty</th>
                                    <th className="text-right pb-2 font-medium">Price</th>
                                    <th className="text-right pb-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, i) => (
                                    <tr key={o.id || i} className="border-t border-edge/[0.02]">
                                        <td className="py-1.5 font-semibold text-heading">{o.symbol?.replace('.NS', '')}</td>
                                        <td className={cn('py-1.5 font-semibold', o.side === 'BUY' ? 'text-bull' : 'text-bear')}>{o.side}</td>
                                        <td className="py-1.5 text-gray-400">{o.order_type}</td>
                                        <td className="py-1.5 text-right font-mono text-gray-300">{o.quantity}</td>
                                        <td className="py-1.5 text-right font-mono text-heading">
                                            {formatPrice(o.filled_price ?? o.price ?? null)}
                                        </td>
                                        <td className="py-1.5 text-right">
                                            <span className={cn('text-[11px] px-1.5 py-0.5 rounded font-medium', ORDER_STATUS_CLASS[o.status] || ORDER_STATUS_CLASS.PENDING)}>
                                                {o.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-6 text-gray-600 text-xs">No orders yet.</div>
                    )
                )}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TradingTerminalPage() {
    const [searchParams] = useSearchParams();
    const initialSymbol = searchParams.get('symbol') || 'RELIANCE.NS';
    const initialAction = (searchParams.get('action') || 'buy').toUpperCase(); // eslint-disable-line no-unused-vars

    const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
    const [chartPeriod, setChartPeriod] = useState(DEFAULT_CHART_PERIOD);
    const [watchlistId, setWatchlistId] = useState(null);
    const [watchlistItems, setWatchlistItems] = useState([]);
    const [watchlistPrices, setWatchlistPrices] = useState({});
    const [isTerminalFocused, setIsTerminalFocused] = useState(false);

    // Zustand stores
    const { holdings, orders, refreshPortfolio } = usePortfolioStore();
    const batchUpdateQuotes = useMarketStore((s) => s.batchUpdateQuotes);

    // Hook: quote + candles for the selected symbol
    const { quote, candles, isLoading: chartLoading, fetchCandles } = useMarketData(selectedSymbol);


    // Re-fetch candles when period or symbol changes
    useEffect(() => {
        const cfg = CHART_PERIODS[chartPeriod] || CHART_PERIODS[DEFAULT_CHART_PERIOD];
        fetchCandles(cfg.period, cfg.interval);
    }, [selectedSymbol, chartPeriod, fetchCandles]);

    // Load portfolio on mount
    useEffect(() => {
        refreshPortfolio();
    }, [refreshPortfolio]);

    // Load watchlist
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/watchlist');
                const wls = res.data.watchlists || [];
                if (wls.length > 0) {
                    setWatchlistId(wls[0].id);
                    setWatchlistItems(wls[0].items || []);
                } else {
                    const createRes = await api.post('/watchlist', { name: 'My Watchlist' });
                    setWatchlistId(createRes.data.id);
                    const seeded = [];
                    for (const sym of DEFAULT_WATCHLIST_SYMBOLS) {
                        try {
                            const r = await api.post(`/watchlist/${createRes.data.id}/items`, { symbol: sym });
                            seeded.push(r.data);
                        } catch { /* skip */ }
                    }
                    setWatchlistItems(seeded);
                }
            } catch { /* ignore */ }
        };
        load();
    }, []);

    // Poll watchlist prices every 15 s
    useEffect(() => {
        if (watchlistItems.length === 0) return;
        const fetchPrices = async () => {
            const symbols = watchlistItems.map((w) => w.symbol).join(',');
            try {
                const res = await api.get(`/market/batch?symbols=${symbols}`);
                const quotes = res.data.quotes || {};
                setWatchlistPrices(quotes);
                batchUpdateQuotes(quotes);
            } catch { /* ignore */ }
        };
        fetchPrices();
        const id = setInterval(fetchPrices, 15_000);
        return () => clearInterval(id);
    }, [watchlistItems, batchUpdateQuotes]);

    const handleSelectSymbol = useCallback((symbol) => setSelectedSymbol(symbol), []);
    const handleBuy = useCallback((symbol) => setSelectedSymbol(symbol), []);
    const handleSell = useCallback((symbol) => setSelectedSymbol(symbol), []);



    return (
        <div
            className="h-[calc(100vh-56px-36px)] flex overflow-hidden"
            onFocus={() => setIsTerminalFocused(true)}
            onBlur={() => setIsTerminalFocused(false)}
        >
            {/* ── LEFT: Watchlist ────────────────────────────────────────── */}
            <div className="w-[260px] flex-shrink-0 hidden lg:flex flex-col">
                <Watchlist
                    watchlistId={watchlistId}
                    items={watchlistItems}
                    prices={watchlistPrices}
                    selectedSymbol={selectedSymbol}
                    isLoading={false}
                    onSelectSymbol={handleSelectSymbol}
                    onItemsChange={setWatchlistItems}
                    onBuy={handleBuy}
                    onSell={handleSell}
                />
            </div>

            {/* ── CENTER: Chart + bottom tabs ────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Symbol header bar */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-b border-edge/5 bg-surface-900/30 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-heading leading-none">
                            {selectedSymbol.replace('.NS', '')}
                        </h2>
                        <span className="text-xs text-gray-500">{quote?.name || selectedSymbol} • NSE</span>
                    </div>

                    {quote?.price != null && (
                        <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold font-mono text-heading tabular-nums">
                                {formatPrice(quote.price)}
                            </span>
                            {quote.change != null && (
                                <span className={cn('text-sm font-mono font-semibold', pnlColorClass(quote.change))}>
                                    {quote.change >= 0 ? '+' : ''}{formatPrice(quote.change)}{' '}
                                    ({formatPercent(quote.change_percent)})
                                </span>
                            )}
                        </div>
                    )}

                    <div className="hidden xl:flex items-center gap-4 ml-auto text-xs text-gray-500">
                        {[
                            ['Open', quote?.open],
                            ['High', quote?.high],
                            ['Low', quote?.low],
                            ['Prev', quote?.prev_close],
                        ].map(([label, val]) => val != null && (
                            <div key={label}>
                                <span className="text-gray-600">{label}: </span>
                                <span className="font-mono text-gray-400">{formatPrice(val)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart — fills remaining height */}
                <div className="flex-1 min-h-0">
                    <ErrorBoundary fallback="Chart failed to load. Please refresh.">
                        <TradingChart
                            candles={candles}
                            period={chartPeriod}
                            onPeriodChange={setChartPeriod}
                            isLoading={chartLoading}
                            symbol={selectedSymbol}
                        />
                    </ErrorBoundary>
                </div>

                {/* Bottom tabs */}
                <BottomTabs holdings={holdings} orders={orders} />
            </div>

            {/* ── RIGHT: Order panel ─────────────────────────────────────── */}
            <div className="w-[300px] flex-shrink-0 hidden lg:flex flex-col">
                <OrderPanel
                    symbol={selectedSymbol}
                    currentPrice={quote?.price ?? 0}
                    isTerminalFocused={isTerminalFocused}
                />
            </div>
        </div>
    );
}
