import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiLightningBolt, HiPlay, HiPause, HiPlus, HiClock, HiChartBar } from 'react-icons/hi';

const STRATEGY_TYPES = [
    { value: 'SMA_CROSSOVER', label: 'SMA Crossover', desc: 'Buy when short SMA crosses above long SMA' },
    { value: 'RSI', label: 'RSI Oversold/Overbought', desc: 'Buy on RSI oversold, sell on overbought' },
    { value: 'MACD', label: 'MACD Signal', desc: 'Trade MACD crossovers' },
    { value: 'BOLLINGER', label: 'Bollinger Bands', desc: 'Mean reversion on band touches' },
];

export default function AlgoTradingPage() {
    const [strategies, setStrategies] = useState([]);
    const [logs, setLogs] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', strategy_type: 'SMA_CROSSOVER', symbol: 'RELIANCE', description: '', max_position_size: 100, stop_loss_percent: 2, take_profit_percent: 5 });

    useEffect(() => {
        loadStrategies();
    }, []);

    const loadStrategies = async () => {
        try {
            const res = await api.get('/algo/strategies');
            setStrategies(res.data.strategies || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/algo/strategies', { ...form, parameters: {} });
            toast.success('Strategy created!');
            setShowCreate(false);
            setForm({ name: '', strategy_type: 'SMA_CROSSOVER', symbol: 'RELIANCE', description: '', max_position_size: 100, stop_loss_percent: 2, take_profit_percent: 5 });
            loadStrategies();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create strategy');
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await api.put(`/algo/strategies/${id}/toggle`);
            toast.success(res.data.message);
            loadStrategies();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to toggle');
        }
    };

    const loadLogs = async (id) => {
        setSelectedStrategy(id);
        try {
            const res = await api.get(`/algo/strategies/${id}/logs`);
            setLogs(res.data.logs || []);
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-heading">Algo Trading</h1>
                    <p className="text-gray-500 text-sm mt-1">Create and manage automated trading strategies</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="btn-primary inline-flex items-center gap-2 text-sm">
                    <HiPlus className="w-4 h-4" /> New Strategy
                </button>
            </div>

            {/* Create Strategy Form */}
            {showCreate && (
                <div className="glass-card p-6 animate-slide-up">
                    <h3 className="font-semibold text-heading mb-4">Create New Strategy</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Strategy Name</label>
                            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., NIFTY SMA Scalper" required className="input-field" />
                        </div>
                        <div>
                            <label className="label-text">Symbol</label>
                            <input type="text" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="e.g., RELIANCE" required className="input-field" />
                        </div>
                        <div>
                            <label className="label-text">Strategy Type</label>
                            <select value={form.strategy_type} onChange={e => setForm(f => ({ ...f, strategy_type: e.target.value }))} className="input-field cursor-pointer">
                                {STRATEGY_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Max Position Size</label>
                            <input type="number" value={form.max_position_size} onChange={e => setForm(f => ({ ...f, max_position_size: parseInt(e.target.value) }))} className="input-field" />
                        </div>
                        <div>
                            <label className="label-text">Stop Loss %</label>
                            <input type="number" step="0.1" value={form.stop_loss_percent} onChange={e => setForm(f => ({ ...f, stop_loss_percent: parseFloat(e.target.value) }))} className="input-field" />
                        </div>
                        <div>
                            <label className="label-text">Take Profit %</label>
                            <input type="number" step="0.1" value={form.take_profit_percent} onChange={e => setForm(f => ({ ...f, take_profit_percent: parseFloat(e.target.value) }))} className="input-field" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-text">Description</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows="2" placeholder="Describe your strategy logic..." className="input-field resize-none" />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" className="btn-primary text-sm">Create Strategy</button>
                            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Strategies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategies.map(s => (
                    <div key={s.id} className="glass-card-hover p-5 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-heading">{s.name}</h3>
                                <span className="text-xs text-gray-500">{s.symbol?.replace('.NS', '')} • {STRATEGY_TYPES.find(t => t.value === s.strategy_type)?.label || s.strategy_type}</span>
                            </div>
                            <button onClick={() => handleToggle(s.id)}
                                className={`p-2 rounded-lg transition-all ${s.is_active ? 'bg-profit/20 text-profit hover:bg-profit/30' : 'bg-surface-700 text-gray-500 hover:text-heading'}`}>
                                {s.is_active ? <HiPause className="w-4 h-4" /> : <HiPlay className="w-4 h-4" />}
                            </button>
                        </div>

                        {s.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>}

                        <div className="grid grid-cols-3 gap-2 mt-auto">
                            <div className="text-center p-2 bg-surface-900/50 rounded">
                                <div className="text-xs text-gray-500">Trades</div>
                                <div className="font-mono font-bold text-heading text-sm">{s.total_trades}</div>
                            </div>
                            <div className="text-center p-2 bg-surface-900/50 rounded">
                                <div className="text-xs text-gray-500">P&L</div>
                                <div className={`font-mono font-bold text-sm ${s.total_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                    {s.total_pnl >= 0 ? '+' : ''}₹{Number(s.total_pnl).toFixed(0)}
                                </div>
                            </div>
                            <div className="text-center p-2 bg-surface-900/50 rounded">
                                <div className="text-xs text-gray-500">Win</div>
                                <div className="font-mono font-bold text-heading text-sm">{s.win_rate}%</div>
                            </div>
                        </div>

                        <button onClick={() => loadLogs(s.id)}
                            className="mt-3 text-xs text-primary-400 hover:text-primary-300 text-left flex items-center gap-1">
                            <HiClock className="w-3 h-3" /> View Logs
                        </button>
                    </div>
                ))}

                {strategies.length === 0 && !showCreate && (
                    <div className="md:col-span-2 lg:col-span-3 glass-card p-12 text-center">
                        <HiLightningBolt className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-lg font-medium text-gray-500">No strategies yet</p>
                        <p className="text-sm text-gray-600 mt-1">Create your first algo trading strategy to get started</p>
                        <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">Define entry/exit conditions using technical indicators. Strategies run automatically during market hours.</p>
                        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">Moving Average Crossover</span>
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">RSI Oversold Bounce</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Strategy Logs */}
            {selectedStrategy && logs.length > 0 && (
                <div className="glass-card p-5 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-heading">Strategy Logs</h3>
                        <button onClick={() => { setSelectedStrategy(null); setLogs([]); }} className="text-gray-500 hover:text-heading text-sm">Close</button>
                    </div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {logs.map(l => (
                            <div key={l.id} className="flex items-start gap-3 py-2 text-sm border-b border-edge/[0.02]">
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${l.level === 'ERROR' ? 'bg-red-500/10 text-red-400' : l.level === 'TRADE' ? 'bg-primary-500/10 text-primary-400' : 'bg-surface-700 text-gray-400'}`}>
                                    {l.level}
                                </span>
                                <span className="text-gray-300">{l.message}</span>
                                <span className="text-gray-600 text-xs ml-auto flex-shrink-0">{l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
