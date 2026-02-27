// ─── TradingTerminalPage — refactored ────────────────────────────────────────
// Layout: [Watchlist 200px] | [Chart + BottomTabs flex-1] | [OrderPanel 300px]
// All data logic delegated to useMarketData, usePortfolioStore, and Zustand.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketData } from '../hooks/useMarketData';
import TradingChart from '../components/trading/TradingChart';
import { useZeroLossStore } from '../stores/useZeroLossStore';
import Watchlist from '../components/trading/Watchlist';
import OrderPanel from '../components/trading/OrderPanel';
import { StrategyDock } from '../strategy/components';
import { runEngine, getAvailableStrategies } from '../strategy';
import ErrorBoundary from '../components/ErrorBoundary';
import { cn } from '../utils/cn';
import { formatPrice, formatPercent, pnlColorClass } from '../utils/formatters';
import { CHART_PERIODS, DEFAULT_CHART_PERIOD, ORDER_STATUS_CLASS } from '../utils/constants';
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

    // ── FIX: re-sync selectedSymbol whenever the URL ?symbol= param changes ──
    // This handles clicks from MarketTickerBar, Navbar search, or any Link that
    // navigates to /terminal?symbol=XYZ after the page is already mounted.
    const symbolFromUrl = searchParams.get('symbol') || 'RELIANCE.NS';
    const [selectedSymbol, setSelectedSymbol] = useState(symbolFromUrl);

    useEffect(() => {
        if (symbolFromUrl && symbolFromUrl !== selectedSymbol) {
            setSelectedSymbol(symbolFromUrl);
        }
    // We intentionally only react to symbolFromUrl changes, not selectedSymbol
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbolFromUrl]);

    // ZeroLoss backend confidence/direction for selected symbol
    const zlConfidence = useZeroLossStore((s) => s.confidence[selectedSymbol] || null);

    const [chartPeriod, setChartPeriod] = useState(DEFAULT_CHART_PERIOD);
    const [watchlistId, setWatchlistId] = useState(null);
    const [watchlistItems, setWatchlistItems] = useState([]);
    const [watchlistPrices, setWatchlistPrices] = useState({});
    const [isTerminalFocused, setIsTerminalFocused] = useState(false);
    const [strategyDockOpen, setStrategyDockOpen] = useState(false);
    const [watchlistOpen, setWatchlistOpen] = useState(true);
    const [bottomTabsOpen, setBottomTabsOpen] = useState(false);

    // Zustand stores
    const { holdings, orders, refreshPortfolio } = usePortfolioStore();
    const batchUpdateQuotes = useMarketStore((s) => s.batchUpdateQuotes);

    // Hook: quote + candles for the selected symbol
    const { quote, candles, isLoading: chartLoading, fetchCandles } = useMarketData(selectedSymbol);

    // Compute trend data for chart overlay
    const trendData = useMemo(() => {
        if (!candles || candles.length === 0) return null;
        const strategies = getAvailableStrategies();
        const enabledIds = strategies.map((s) => s.id);
        const result = runEngine(candles, enabledIds);
        return {
            overall: result.overall,
            confidence: result.confidence,
            weightedScore: result.weightedScore ?? 0,
        };
    }, [candles]);

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
                    setWatchlistItems([]);
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
            {watchlistOpen && (
                <div className="w-[220px] flex-shrink-0 hidden lg:flex flex-col relative transition-all duration-300">
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
                        onClose={() => setWatchlistOpen(false)}
                    />
                </div>
            )}

            {/* ── Open Watchlist toggle (when closed) ─────────────────── */}
            {!watchlistOpen && (
                <button
                    onClick={() => setWatchlistOpen(true)}
                    className="hidden lg:flex flex-shrink-0 flex-col items-center justify-center gap-2 w-10 h-full border-r border-edge/5 bg-surface-900/50 hover:bg-surface-800/70 text-gray-500 hover:text-primary-400 transition-all duration-200 group"
                    title="Open watchlist"
                >
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 mt-1 text-gray-400 group-hover:text-primary-400 transition-colors">Watchlist</span>
                </button>
            )}

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
                <div className={cn('min-h-0 relative', bottomTabsOpen ? 'flex-1' : 'flex-[1_1_0%]')}>
                    <ErrorBoundary fallback="Chart failed to load. Please refresh.">
                        <TradingChart
                            candles={candles}
                            period={chartPeriod}
                            onPeriodChange={setChartPeriod}
                            isLoading={chartLoading}
                            symbol={selectedSymbol}
                            trendData={trendData}
                            zeroLossTrend={zlConfidence}
                        />
                    </ErrorBoundary>

                    {/* Strategy Dock toggle button */}
                    <button
                        onClick={() => setStrategyDockOpen((v) => !v)}
                        className={cn(
                            'absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-md text-xs font-semibold transition-all duration-200 shadow-lg',
                            strategyDockOpen
                                ? 'bg-primary-600/20 border-primary-500/40 text-primary-400 shadow-primary-500/10'
                                : 'bg-surface-800/80 border-edge/20 text-gray-400 hover:text-gray-200 hover:border-edge/40'
                        )}
                        title="Toggle Strategy Dock"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Strategies
                    </button>
                </div>

                {/* Bottom tabs (collapsible) */}
                <div className="border-t border-edge/5">
                    <button
                        onClick={() => setBottomTabsOpen((v) => !v)}
                        className="w-full h-7 flex items-center justify-center gap-2 bg-surface-900/40 hover:bg-surface-800/50 text-gray-500 hover:text-primary-400 transition-colors text-[11px] font-semibold tracking-wide"
                    >
                        <svg className={cn('w-3.5 h-3.5 transition-transform duration-200', bottomTabsOpen ? 'rotate-0' : 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        POSITIONS ({holdings.length}) &middot; ORDERS ({orders.length})
                    </button>
                    {bottomTabsOpen && <BottomTabs holdings={holdings} orders={orders} />}
                </div>
            </div>

            {/* ── RIGHT: Order panel (full height) ──────────────────────── */}
            <div className="w-[300px] flex-shrink-0 hidden lg:flex flex-col">
                <OrderPanel
                    symbol={selectedSymbol}
                    currentPrice={quote?.price ?? 0}
                    isTerminalFocused={isTerminalFocused}
                />
            </div>

            {/* ── Floating Strategy Dock popup ───────────────────────────── */}
            <ErrorBoundary fallback="Strategy dock failed to load.">
                <StrategyDock
                    candles={candles}
                    isOpen={strategyDockOpen}
                    onClose={() => setStrategyDockOpen(false)}
                />
            </ErrorBoundary>
        </div>
    );
}