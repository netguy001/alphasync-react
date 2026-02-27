import { useEffect } from 'react';
import { useMarketIndicesStore } from '../../stores/useMarketIndicesStore';
import { cn } from '../../utils/cn';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

function TickerItem({ item }) {
    const isPositive = (item.change ?? 0) >= 0;
    const isIndex = item.kind === 'index';
    return (
        <div className="flex items-center gap-2 flex-shrink-0 px-3">
            <span className={cn(
                'text-[11px] font-semibold whitespace-nowrap',
                isIndex ? 'text-gray-300' : 'text-gray-400'
            )}>
                {item.name}
            </span>
            <span className="text-[11px] font-mono text-heading font-medium tabular-nums">
                {formatPrice(item.price, 2)}
            </span>
            <span className={cn(
                'flex items-center gap-0.5 text-[11px] font-mono tabular-nums',
                isPositive ? 'text-bull' : 'text-bear'
            )}>
                {isPositive
                    ? <HiTrendingUp className="w-3 h-3" />
                    : <HiTrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{formatPercent(item.change_percent, 2)}
            </span>
            {/* separator dot */}
            <span className="text-gray-700 text-[8px] ml-1">●</span>
        </div>
    );
}

/**
 * Horizontally scrolling ticker bar (marquee) showing indices + stocks.
 * Duplicates content so scroll loops seamlessly.
 */
export default function MarketTickerBar() {
    const tickerItems = useMarketIndicesStore((s) => s.tickerItems);
    const indices = useMarketIndicesStore((s) => s.indices);
    const isLoading = useMarketIndicesStore((s) => s.isLoading);
    const startPolling = useMarketIndicesStore((s) => s.startPolling);
    const stopPolling = useMarketIndicesStore((s) => s.stopPolling);

    useEffect(() => {
        startPolling(60_000);
        return () => stopPolling();
    }, [startPolling, stopPolling]);

    // Use tickerItems if available, fall back to indices
    const items = tickerItems.length > 0 ? tickerItems : indices;

    if (isLoading || items.length === 0) return null;

    return (
        <div className="h-8 bg-surface-900/60 border-b border-edge/5 overflow-hidden flex items-center relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-900/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-900/90 to-transparent z-10 pointer-events-none" />

            {/* Marquee track — two copies for seamless loop */}
            <div className="ticker-marquee flex items-center">
                <div className="ticker-track flex items-center">
                    {items.map((item, i) => (
                        <TickerItem key={`a-${i}`} item={item} />
                    ))}
                </div>
                <div className="ticker-track flex items-center" aria-hidden="true">
                    {items.map((item, i) => (
                        <TickerItem key={`b-${i}`} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
