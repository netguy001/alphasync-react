import { formatCurrency } from '../../utils/formatters';
import PnLCard from './PnLCard';
import Skeleton from '../ui/Skeleton';

/**
 * Portfolio summary: 5-card stat grid + capital allocation bar.
 *
 * @param {{ summary: object|null, isLoading: boolean }} props
 */
export default function PortfolioSummary({ summary, isLoading }) {
    const availableCash = summary?.available_capital ?? 0;
    const currentValue = summary?.current_value ?? 0;
    const totalInvested = summary?.total_invested ?? 0;
    const totalPnl = summary?.total_pnl ?? 0;
    const totalPnlPct = summary?.total_pnl_percent ?? 0;
    const totalCapital = availableCash + currentValue;
    const investedPct = totalCapital > 0 ? (totalInvested / totalCapital) * 100 : 0;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} variant="stat-card" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stat grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Total Capital</span>
                    <span className="text-xl font-bold text-heading font-mono">{formatCurrency(totalCapital)}</span>
                </div>
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Available Cash</span>
                    <span className="text-xl font-bold text-heading font-mono">{formatCurrency(availableCash)}</span>
                </div>
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Invested</span>
                    <span className="text-xl font-bold text-heading font-mono">{formatCurrency(totalInvested)}</span>
                    <span className="text-xs text-gray-500">{investedPct.toFixed(1)}% deployed</span>
                </div>
                <div className="stat-card">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Current Value</span>
                    <span className="text-xl font-bold text-heading font-mono">{formatCurrency(currentValue)}</span>
                </div>
                <PnLCard label="Total P&L" value={totalPnl} percent={totalPnlPct} />
            </div>

            {/* Capital allocation bar */}
            <div className="glass-card p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Capital Allocation
                </h2>
                <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden flex">
                    <div
                        className="bg-primary-500 h-full rounded-l-full transition-all duration-700"
                        style={{ width: `${investedPct}%` }}
                    />
                    <div
                        className="bg-accent-emerald/30 h-full rounded-r-full transition-all duration-700"
                        style={{ width: `${100 - investedPct}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                    <span className="text-primary-400">Invested: {investedPct.toFixed(1)}%</span>
                    <span className="text-accent-emerald">Cash: {(100 - investedPct).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}
