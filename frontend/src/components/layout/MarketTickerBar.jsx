import { useState, useEffect } from 'react';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

/**
 * Horizontally scrolling ticker bar showing major market indices.
 * Auto-refreshes every 60 seconds.
 */
export default function MarketTickerBar() {
    const [indices, setIndices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const res = await api.get('/market/indices');
                setIndices(res.data.indices || []);
            } catch { /* ignore */ } finally {
                setIsLoading(false);
            }
        };
        fetchIndices();
        const interval = setInterval(fetchIndices, 60_000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading || indices.length === 0) return null;

    return (
        <div className="h-9 bg-surface-900/60 border-b border-edge/5 overflow-hidden flex items-center">
            <div className="flex items-center gap-6 px-4 overflow-x-auto scrollbar-none">
                {indices.map((idx, i) => {
                    const isPositive = (idx.change ?? 0) >= 0;
                    return (
                        <div key={i} className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-400">{idx.name}</span>
                            <span className="text-xs font-mono text-heading font-medium">
                                {formatPrice(idx.price, 2)}
                            </span>
                            <span className={cn(
                                'flex items-center gap-0.5 text-xs font-mono',
                                isPositive ? 'text-bull' : 'text-bear'
                            )}>
                                {isPositive
                                    ? <HiTrendingUp className="w-3 h-3" />
                                    : <HiTrendingDown className="w-3 h-3" />}
                                {formatPercent(idx.change_percent, 2)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
