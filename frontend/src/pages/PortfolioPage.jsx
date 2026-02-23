import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiTrendingUp, HiTrendingDown, HiCurrencyRupee } from 'react-icons/hi';

export default function PortfolioPage() {
    const [portfolio, setPortfolio] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fmt = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';
    const pnlColor = (v) => v >= 0 ? 'text-profit' : 'text-loss';

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/portfolio/summary');
                setPortfolio(res.data.summary);
                setHoldings(res.data.holdings || []);
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalCapital = (portfolio?.available_capital || 0) + (portfolio?.current_value || 0);
    const investedPercent = totalCapital ? ((portfolio?.total_invested || 0) / totalCapital * 100) : 0;

    return (
        <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-white">Portfolio</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Capital', value: fmt(totalCapital), sub: null },
                    { label: 'Available Cash', value: fmt(portfolio?.available_capital), sub: null },
                    { label: 'Invested', value: fmt(portfolio?.total_invested), sub: `${investedPercent.toFixed(1)}% deployed` },
                    { label: 'Current Value', value: fmt(portfolio?.current_value), sub: null },
                    {
                        label: 'Total P&L',
                        value: fmt(portfolio?.total_pnl),
                        sub: portfolio?.total_pnl_percent != null ? `${portfolio.total_pnl_percent >= 0 ? '+' : ''}${portfolio.total_pnl_percent.toFixed(2)}%` : null,
                        isColor: true
                    },
                ].map(({ label, value, sub, isColor }, i) => (
                    <div key={i} className="stat-card">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
                        <span className={`text-xl font-bold font-mono ${isColor && portfolio?.total_pnl != null ? pnlColor(portfolio.total_pnl) : 'text-white'}`}>
                            {value}
                        </span>
                        {sub && <span className={`text-xs ${isColor ? pnlColor(portfolio?.total_pnl || 0) : 'text-gray-500'}`}>{sub}</span>}
                    </div>
                ))}
            </div>

            {/* Capital Allocation Bar */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Capital Allocation</h2>
                <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden flex">
                    <div className="bg-primary-500 h-full rounded-l-full transition-all duration-500" style={{ width: `${investedPercent}%` }}></div>
                    <div className="bg-accent-emerald/30 h-full rounded-r-full transition-all duration-500" style={{ width: `${100 - investedPercent}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                    <span className="text-primary-400">Invested: {investedPercent.toFixed(1)}%</span>
                    <span className="text-accent-emerald">Cash: {(100 - investedPercent).toFixed(1)}%</span>
                </div>
            </div>

            {/* Holdings Table */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Holdings ({holdings.length})</h2>
                {holdings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase border-b border-white/5">
                                    <th className="text-left py-3 font-medium">Symbol</th>
                                    <th className="text-right py-3 font-medium">Qty</th>
                                    <th className="text-right py-3 font-medium">Avg Price</th>
                                    <th className="text-right py-3 font-medium">LTP</th>
                                    <th className="text-right py-3 font-medium">Invested</th>
                                    <th className="text-right py-3 font-medium">Current</th>
                                    <th className="text-right py-3 font-medium">P&L</th>
                                    <th className="text-right py-3 font-medium">P&L %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => (
                                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3">
                                            <div className="font-semibold text-white">{h.symbol?.replace('.NS', '')}</div>
                                            <div className="text-xs text-gray-600">{h.company_name || h.exchange}</div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-gray-300">{h.quantity}</td>
                                        <td className="py-3 text-right font-mono text-gray-300">{Number(h.avg_price).toFixed(2)}</td>
                                        <td className="py-3 text-right font-mono text-white font-semibold">{Number(h.current_price).toFixed(2)}</td>
                                        <td className="py-3 text-right font-mono text-gray-300">{fmt(h.invested_value)}</td>
                                        <td className="py-3 text-right font-mono text-white">{fmt(h.current_value)}</td>
                                        <td className={`py-3 text-right font-mono font-semibold ${pnlColor(h.pnl)}`}>
                                            {h.pnl >= 0 ? '+' : ''}{fmt(h.pnl)}
                                        </td>
                                        <td className={`py-3 text-right font-mono font-semibold ${pnlColor(h.pnl_percent)}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {h.pnl_percent >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                                                {h.pnl_percent >= 0 ? '+' : ''}{Number(h.pnl_percent).toFixed(2)}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-600">
                        <HiCurrencyRupee className="w-12 h-12 mx-auto mb-3" />
                        <p className="text-lg font-medium text-gray-500">No holdings yet</p>
                        <p className="text-sm text-gray-600 mt-1">Visit the Trading Terminal to place your first trade</p>
                    </div>
                )}
            </div>
        </div>
    );
}
