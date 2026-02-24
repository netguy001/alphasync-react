import { formatCurrency, formatPercent, pnlColorClass } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

/**
 * Single P&L display card used in the portfolio summary row.
 *
 * @param {{
 *   label: string,
 *   value: number,
 *   percent?: number,
 *   compact?: boolean,
 * }} props
 */
export default function PnLCard({ label, value, percent, compact = false }) {
    const isPositive = (value ?? 0) >= 0;
    const Icon = isPositive ? HiTrendingUp : HiTrendingDown;

    return (
        <div className="stat-card">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                <span className={cn('font-bold font-mono', compact ? 'text-lg' : 'text-xl', pnlColorClass(value ?? 0))}>
                    {value != null ? `${isPositive ? '+' : ''}${formatCurrency(value)}` : '—'}
                </span>
                <Icon className={cn('w-4 h-4', pnlColorClass(value ?? 0))} />
            </div>
            {percent != null && (
                <span className={cn('text-xs font-mono', pnlColorClass(percent))}>
                    {formatPercent(percent, 2)}
                </span>
            )}
        </div>
    );
}
