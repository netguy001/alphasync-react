import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiPlus, HiX, HiRefresh, HiSwitchVertical } from 'react-icons/hi';

export default function TradingTerminalPage() {
    const [searchParams] = useSearchParams();
    const { theme } = useTheme();
    const initialSymbol = searchParams.get('symbol') || 'RELIANCE.NS';
    const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
    const [quote, setQuote] = useState(null);
    const [candles, setCandles] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [watchlistId, setWatchlistId] = useState(null);
    const [watchlistPrices, setWatchlistPrices] = useState({});
    const [orders, setOrders] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [orderForm, setOrderForm] = useState({ side: 'BUY', type: 'MARKET', quantity: 1, price: '', triggerPrice: '' });
    const [chartPeriod, setChartPeriod] = useState('3mo');
    const [loading, setLoading] = useState(false);
    const [popularStocks, setPopularStocks] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const seriesRef = useRef(null);

    const fmt = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

    // Load watchlist
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/watchlist');
                const wls = res.data.watchlists || [];
                if (wls.length > 0) {
                    setWatchlistId(wls[0].id);
                    setWatchlist(wls[0].items || []);
                } else {
                    // Create default watchlist
                    const createRes = await api.post('/watchlist', { name: 'My Watchlist' });
                    setWatchlistId(createRes.data.id);
                    // Add some default stocks
                    const defaults = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS'];
                    const items = [];
                    for (const sym of defaults) {
                        try {
                            const r = await api.post(`/watchlist/${createRes.data.id}/items`, { symbol: sym });
                            items.push(r.data);
                        } catch { /* skip */ }
                    }
                    setWatchlist(items);
                }

                const popRes = await api.get('/market/popular');
                setPopularStocks(popRes.data.stocks || []);
            } catch { /* ignore */ }
        };
        load();
    }, []);

    // Load orders and holdings
    useEffect(() => {
        const load = async () => {
            try {
                const [oRes, hRes] = await Promise.allSettled([
                    api.get('/orders'),
                    api.get('/portfolio/holdings'),
                ]);
                if (oRes.status === 'fulfilled') setOrders(oRes.value.data.orders || []);
                if (hRes.status === 'fulfilled') setHoldings(hRes.value.data.holdings || []);
            } catch { /* ignore */ }
        };
        load();
    }, []);

    // Fetch live prices for watchlist
    useEffect(() => {
        if (watchlist.length === 0) return;
        const fetchPrices = async () => {
            const symbols = watchlist.map(w => w.symbol).join(',');
            try {
                const res = await api.get(`/market/batch?symbols=${symbols}`);
                setWatchlistPrices(res.data.quotes || {});
            } catch { /* ignore */ }
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 15000);
        return () => clearInterval(interval);
    }, [watchlist]);

    // Fetch quote for selected symbol
    const fetchQuote = useCallback(async (sym) => {
        try {
            const res = await api.get(`/market/quote/${sym}`);
            setQuote(res.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchQuote(selectedSymbol);
        const interval = setInterval(() => fetchQuote(selectedSymbol), 15000);
        return () => clearInterval(interval);
    }, [selectedSymbol, fetchQuote]);

    // Fetch candle data
    useEffect(() => {
        const fetchCandles = async () => {
            try {
                const res = await api.get(`/market/history/${selectedSymbol}?period=${chartPeriod}&interval=1d`);
                setCandles(res.data.candles || []);
            } catch { /* ignore */ }
        };
        fetchCandles();
    }, [selectedSymbol, chartPeriod]);

    // Render chart with lightweight-charts
    useEffect(() => {
        if (!chartRef.current || candles.length === 0) return;
        let cancelled = false;
        let resizeHandler = null;

        const initChart = async () => {
            const { createChart, ColorType } = await import('lightweight-charts');
            if (cancelled) return;
            if (chartInstance.current) {
                chartInstance.current.remove();
                chartInstance.current = null;
            }
            const chart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: chartRef.current.clientHeight,
                layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af', fontSize: 12, fontFamily: 'Inter' },
                grid: { vertLines: { color: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }, horzLines: { color: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' } },
                rightPriceScale: { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' },
                timeScale: { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)', timeVisible: true },
                crosshair: { mode: 0, vertLine: { color: 'rgba(99,102,241,0.3)', width: 1, style: 2 }, horzLine: { color: 'rgba(99,102,241,0.3)', width: 1, style: 2 } },
            });
            const series = chart.addCandlestickSeries({
                upColor: '#22c55e', downColor: '#ef4444',
                borderUpColor: '#22c55e', borderDownColor: '#ef4444',
                wickUpColor: '#22c55e', wickDownColor: '#ef4444',
            });
            series.setData(candles);
            chart.timeScale().fitContent();
            chartInstance.current = chart;
            seriesRef.current = series;

            resizeHandler = () => { if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }); };
            window.addEventListener('resize', resizeHandler);
        };
        initChart();

        return () => {
            cancelled = true;
            if (resizeHandler) window.removeEventListener('resize', resizeHandler);
            if (chartInstance.current) {
                chartInstance.current.remove();
                chartInstance.current = null;
            }
        };
    }, [candles, theme]);

    // Place order
    const handleOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                symbol: selectedSymbol,
                side: orderForm.side,
                order_type: orderForm.type,
                quantity: parseInt(orderForm.quantity),
                price: orderForm.type === 'LIMIT' ? parseFloat(orderForm.price) : null,
                trigger_price: orderForm.type.includes('STOP') ? parseFloat(orderForm.triggerPrice) : null,
            };
            await api.post('/orders', payload);
            toast.success(`${orderForm.side} order placed for ${selectedSymbol.replace('.NS', '')}`);
            // Refresh data
            const [oRes, hRes] = await Promise.allSettled([api.get('/orders'), api.get('/portfolio/holdings')]);
            if (oRes.status === 'fulfilled') setOrders(oRes.value.data.orders || []);
            if (hRes.status === 'fulfilled') setHoldings(hRes.value.data.holdings || []);
            fetchQuote(selectedSymbol);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Order failed');
        }
        setLoading(false);
    };

    // Add to watchlist
    const addToWatchlist = async (symbol) => {
        if (!watchlistId) return;
        try {
            const res = await api.post(`/watchlist/${watchlistId}/items`, { symbol });
            setWatchlist(prev => [...prev, res.data]);
            toast.success(`${symbol.replace('.NS', '')} added to watchlist`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Already in watchlist');
        }
    };

    const removeFromWatchlist = async (itemId) => {
        if (!watchlistId) return;
        try {
            await api.delete(`/watchlist/${watchlistId}/items/${itemId}`);
            setWatchlist(prev => prev.filter(w => w.id !== itemId));
        } catch { /* ignore */ }
    };

    const totalCost = (quote?.price || 0) * (parseInt(orderForm.quantity) || 0);

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col lg:flex-row overflow-hidden animate-fade-in">
            {/* LEFT: Watchlist */}
            <div className="w-full lg:w-[260px] border-r border-edge/5 flex flex-col bg-surface-900/30 flex-shrink-0 max-lg:max-h-[200px] lg:max-h-none overflow-hidden">
                <div className="px-3 py-3 border-b border-edge/5 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Watchlist</h3>
                    <div className="relative group">
                        <button className="text-gray-500 hover:text-primary-400 transition-colors">
                            <HiPlus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {watchlist.map((item) => {
                        const price = watchlistPrices[item.symbol];
                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedSymbol(item.symbol)}
                                className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-edge/[0.02] transition-all
                  ${selectedSymbol === item.symbol ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-overlay/[0.02] border-l-2 border-l-transparent'}`}
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-heading truncate">{item.symbol?.replace('.NS', '')}</div>
                                    <div className="text-xs text-gray-600">{item.exchange || 'NSE'}</div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    {price ? (
                                        <>
                                            <div className="text-sm font-mono text-heading">{Number(price.price).toFixed(2)}</div>
                                            <div className={`text-xs font-mono ${price.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                {price.change >= 0 ? '+' : ''}{Number(price.change_percent).toFixed(2)}%
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs text-gray-600">Loading...</div>
                                    )}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id); }}
                                    className="ml-1 text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                    <HiX className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                    {watchlist.length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-xs">No stocks in watchlist</div>
                    )}
                </div>
            </div>

            {/* CENTER: Chart + Bottom Panels */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Symbol Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-edge/5 bg-surface-900/30 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-heading">{selectedSymbol.replace('.NS', '')}</h2>
                            <span className="text-xs text-gray-500">{quote?.name || selectedSymbol} • NSE</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold font-mono text-heading">{quote?.price ? Number(quote.price).toFixed(2) : '—'}</span>
                            {quote?.change != null && (
                                <span className={`text-sm font-mono font-semibold ${quote.change >= 0 ? 'text-profit' : 'text-loss'}`}>
                                    {quote.change >= 0 ? '+' : ''}{Number(quote.change).toFixed(2)} ({quote.change_percent >= 0 ? '+' : ''}{Number(quote.change_percent).toFixed(2)}%)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {['1mo', '3mo', '6mo', '1y', '5y'].map(p => (
                            <button key={p} onClick={() => setChartPeriod(p)}
                                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${chartPeriod === p ? 'bg-primary-500/20 text-primary-400' : 'text-gray-500 hover:text-heading hover:bg-overlay/5'}`}>
                                {p.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-0 relative" ref={chartRef}>
                    {candles.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-sm">Loading chart data...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Positions & Orders */}
                <BottomTabs orders={orders} holdings={holdings} fmt={fmt} />
            </div>

            {/* RIGHT: Order Panel */}
            <div className="w-full lg:w-[300px] border-l border-edge/5 bg-surface-900/30 p-4 flex-shrink-0 overflow-y-auto max-lg:border-t max-lg:border-l-0">
                <form onSubmit={handleOrder} className="space-y-4">
                    {/* Buy/Sell Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-edge/10">
                        <button type="button" onClick={() => setOrderForm(f => ({ ...f, side: 'BUY' }))}
                            className={`flex-1 py-2.5 text-sm font-bold transition-all ${orderForm.side === 'BUY' ? 'bg-buy text-white' : 'text-gray-500 hover:text-heading'}`}>
                            BUY
                        </button>
                        <button type="button" onClick={() => setOrderForm(f => ({ ...f, side: 'SELL' }))}
                            className={`flex-1 py-2.5 text-sm font-bold transition-all ${orderForm.side === 'SELL' ? 'bg-sell text-white' : 'text-gray-500 hover:text-heading'}`}>
                            SELL
                        </button>
                    </div>

                    {/* Order Type */}
                    <div>
                        <label className="label-text">Order Type</label>
                        <select value={orderForm.type} onChange={e => setOrderForm(f => ({ ...f, type: e.target.value }))}
                            className="input-field text-sm cursor-pointer">
                            <option value="MARKET">Market</option>
                            <option value="LIMIT">Limit</option>
                            <option value="STOP_LOSS">Stop Loss</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="label-text">Quantity</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOrderForm(f => ({ ...f, quantity: Math.max(1, parseInt(f.quantity) - 1) }))}
                                className="w-10 h-10 rounded-lg bg-surface-800 border border-edge/10 text-heading hover:bg-surface-700 transition-colors flex items-center justify-center">-</button>
                            <input type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm(f => ({ ...f, quantity: e.target.value }))}
                                className="input-field text-center font-mono text-lg flex-1" />
                            <button type="button" onClick={() => setOrderForm(f => ({ ...f, quantity: parseInt(f.quantity || 0) + 1 }))}
                                className="w-10 h-10 rounded-lg bg-surface-800 border border-edge/10 text-heading hover:bg-surface-700 transition-colors flex items-center justify-center">+</button>
                        </div>
                    </div>

                    {/* Limit Price */}
                    {orderForm.type === 'LIMIT' && (
                        <div className="animate-slide-up">
                            <label className="label-text">Limit Price (₹)</label>
                            <input type="number" step="0.05" value={orderForm.price}
                                onChange={e => setOrderForm(f => ({ ...f, price: e.target.value }))}
                                placeholder={quote?.price ? Number(quote.price).toFixed(2) : '0.00'}
                                className="input-field font-mono" required />
                        </div>
                    )}

                    {/* Trigger Price */}
                    {orderForm.type === 'STOP_LOSS' && (
                        <div className="animate-slide-up">
                            <label className="label-text">Trigger Price (₹)</label>
                            <input type="number" step="0.05" value={orderForm.triggerPrice}
                                onChange={e => setOrderForm(f => ({ ...f, triggerPrice: e.target.value }))}
                                placeholder="Stop loss trigger" className="input-field font-mono" required />
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="glass-card p-3 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Market Price</span>
                            <span className="font-mono text-heading">{fmt(quote?.price)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Quantity</span>
                            <span className="font-mono text-heading">{orderForm.quantity}</span>
                        </div>
                        <div className="border-t border-edge/5 pt-2 flex justify-between font-semibold">
                            <span className="text-gray-300">Estimated Total</span>
                            <span className="font-mono text-heading">{fmt(totalCost)}</span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading}
                        className={`w-full py-3.5 rounded-lg font-bold text-white transition-all active:scale-[0.98] shadow-lg
              ${orderForm.side === 'BUY'
                                ? 'bg-buy hover:bg-green-400 shadow-green-500/20'
                                : 'bg-sell hover:bg-red-400 shadow-red-500/20'}`}>
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Placing Order...
                            </span>
                        ) : (
                            `${orderForm.side} ${selectedSymbol.replace('.NS', '')}`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

function BottomTabs({ orders, holdings, fmt }) {
    const [activeTab, setActiveTab] = useState('positions');
    return (
        <div className="h-[200px] border-t border-edge/5 flex-shrink-0 overflow-hidden">
            <div className="flex border-b border-edge/5">
                {['positions', 'orders'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors
                            ${activeTab === tab ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-300'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <div className="overflow-y-auto h-[calc(200px-36px)] p-3">
                {activeTab === 'positions' ? (
                    holdings.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase">
                                    <th className="text-left pb-2 font-medium">Symbol</th>
                                    <th className="text-right pb-2 font-medium">Qty</th>
                                    <th className="text-right pb-2 font-medium">Avg Price</th>
                                    <th className="text-right pb-2 font-medium">LTP</th>
                                    <th className="text-right pb-2 font-medium">P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => (
                                    <tr key={i} className="border-t border-edge/[0.02]">
                                        <td className="py-2 font-semibold text-heading">{h.symbol?.replace('.NS', '')}</td>
                                        <td className="py-2 text-right font-mono text-gray-300">{h.quantity}</td>
                                        <td className="py-2 text-right font-mono text-gray-300">{Number(h.avg_price).toFixed(2)}</td>
                                        <td className="py-2 text-right font-mono text-heading">{Number(h.current_price).toFixed(2)}</td>
                                        <td className={`py-2 text-right font-mono font-semibold ${h.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                            {h.pnl >= 0 ? '+' : ''}{fmt(h.pnl)} ({h.pnl_percent >= 0 ? '+' : ''}{Number(h.pnl_percent).toFixed(2)}%)
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
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase">
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
                                    <tr key={i} className="border-t border-edge/[0.02]">
                                        <td className="py-2 font-semibold text-heading">{o.symbol?.replace('.NS', '')}</td>
                                        <td className={`py-2 text-sm font-semibold ${o.side === 'BUY' ? 'text-buy' : 'text-sell'}`}>{o.side}</td>
                                        <td className="py-2 text-gray-400 text-xs">{o.order_type}</td>
                                        <td className="py-2 text-right font-mono text-gray-300">{o.quantity}</td>
                                        <td className="py-2 text-right font-mono text-heading">{o.filled_price ? Number(o.filled_price).toFixed(2) : (o.price ? Number(o.price).toFixed(2) : '—')}</td>
                                        <td className="py-2 text-right">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${o.status === 'FILLED' ? 'text-profit bg-profit/10' :
                                                o.status === 'CANCELLED' ? 'text-gray-400 bg-gray-400/10' :
                                                    'text-amber-400 bg-amber-400/10'
                                                }`}>{o.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-6 text-gray-600 text-xs">No orders yet. Place your first trade.</div>
                    )
                )}
            </div>
        </div>
    );
}
