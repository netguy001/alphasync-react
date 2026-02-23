import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiTrendingUp, HiTrendingDown, HiCurrencyRupee, HiChartBar, HiArrowRight } from 'react-icons/hi';

export default function DashboardPage() {
    const { user } = useAuth();
    const [portfolio, setPortfolio] = useState(null);
    const [indices, setIndices] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, iRes, hRes, oRes] = await Promise.allSettled([
                    api.get('/portfolio'),
                    api.get('/market/indices'),
                    api.get('/portfolio/holdings'),
                    api.get('/orders'),
                ]);
                if (pRes.status === 'fulfilled') setPortfolio(pRes.value.data);
                if (iRes.status === 'fulfilled') setIndices(iRes.value.data.indices || []);
                if (hRes.status === 'fulfilled') setHoldings(hRes.value.data.holdings || []);
                if (oRes.status === 'fulfilled') setRecentOrders((oRes.value.data.orders || []).slice(0, 5));
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
    }, []);

    const fmt = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';
    const pnlColor = (v) => v >= 0 ? 'text-profit' : 'text-loss';
    const pnlIcon = (v) => v >= 0 ? <HiTrendingUp className="w-4 h-4" /> : <HiTrendingDown className="w-4 h-4" />;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-heading">Welcome back, {user?.full_name?.split(' ')[0] || 'Trader'}</h1>
                <p className="text-gray-500 text-sm mt-1">Here's your portfolio overview</p>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Available Capital</span>
                    <span className="text-xl font-bold text-heading font-mono">{fmt(portfolio?.available_capital)}</span>
                </div>
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Total Invested</span>
                    <span className="text-xl font-bold text-heading font-mono">{fmt(portfolio?.total_invested)}</span>
                </div>
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Current Value</span>
                    <span className="text-xl font-bold text-heading font-mono">{fmt(portfolio?.current_value)}</span>
                </div>
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Total P&L</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xl font-bold font-mono ${pnlColor(portfolio?.total_pnl || 0)}`}>
                            {fmt(portfolio?.total_pnl)}
                        </span>
                        {pnlIcon(portfolio?.total_pnl || 0)}
                    </div>
                </div>
            </div>

            {/* Market Indices & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Indices */}
                <div className="lg:col-span-2 glass-card p-5">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Market Indices</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {indices.length > 0 ? indices.map((idx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50">
                                <div>
                                    <div className="font-semibold text-heading text-sm">{idx.name}</div>
                                    <div className="text-lg font-mono text-heading">{Number(idx.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div className={`text-right ${pnlColor(idx.change)}`}>
                                    <div className="flex items-center gap-1 text-sm font-mono">
                                        {pnlIcon(idx.change)} {idx.change > 0 ? '+' : ''}{Number(idx.change).toFixed(2)}
                                    </div>
                                    <div className="text-xs font-mono">({idx.change_percent > 0 ? '+' : ''}{Number(idx.change_percent).toFixed(2)}%)</div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-8 text-gray-600">
                                <HiChartBar className="w-8 h-8 mx-auto mb-2" />
                                <p>Market data loading...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link to="/terminal" className="flex items-center justify-between p-3 rounded-lg bg-primary-600/10 hover:bg-primary-600/20 border border-primary-500/20 transition-all group">
                            <span className="text-sm font-medium text-heading">Open Trading Terminal</span>
                            <HiArrowRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/portfolio" className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 border border-edge/5 transition-all group">
                            <span className="text-sm font-medium text-gray-300">View Portfolio</span>
                            <HiArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/algo" className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 border border-edge/5 transition-all group">
                            <span className="text-sm font-medium text-gray-300">Algo Strategies</span>
                            <HiArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Holdings & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Holdings */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Holdings</h2>
                        <span className="text-xs text-gray-600">{holdings.length} stocks</span>
                    </div>
                    {holdings.length > 0 ? (
                        <div className="space-y-2">
                            {holdings.slice(0, 5).map((h, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50">
                                    <div>
                                        <div className="text-sm font-semibold text-heading">{h.symbol?.replace('.NS', '')}</div>
                                        <div className="text-xs text-gray-500">{h.quantity} @ {fmt(h.avg_price)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono text-heading">{fmt(h.current_value)}</div>
                                        <div className={`text-xs font-mono ${pnlColor(h.pnl)}`}>
                                            {h.pnl >= 0 ? '+' : ''}{fmt(h.pnl)} ({h.pnl_percent >= 0 ? '+' : ''}{h.pnl_percent?.toFixed(2)}%)
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-600">
                            <HiCurrencyRupee className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">No holdings yet. Start trading!</p>
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Orders</h2>
                        <Link to="/terminal" className="text-xs text-primary-400 hover:text-primary-300">View All</Link>
                    </div>
                    {recentOrders.length > 0 ? (
                        <div className="space-y-2">
                            {recentOrders.map((o, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${o.side === 'BUY' ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'}`}>
                                            {o.side}
                                        </span>
                                        <div>
                                            <div className="text-sm font-semibold text-heading">{o.symbol?.replace('.NS', '')}</div>
                                            <div className="text-xs text-gray-500">{o.quantity} qty</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-mono text-heading">{fmt(o.filled_price || o.price)}</div>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${o.status === 'FILLED' ? 'text-profit bg-profit/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                            {o.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-600">
                            <HiChartBar className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">No orders yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
