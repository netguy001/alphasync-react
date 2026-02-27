// MarketTickerBar.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketIndicesStore } from '../../stores/useMarketIndicesStore';
import { cn } from '../../utils/cn';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

function TickerItem({ item, onClick }) {
    const isPositive = (item.change ?? 0) >= 0;
    const isIndex = item.kind === 'index';
    const isClickable = !isIndex; // only stocks are clickable, not indices

    return (
        <div
            onClick={isClickable ? () => onClick(item) : undefined}
            className={cn(
                'flex items-center gap-2 flex-shrink-0 px-3 py-0.5 rounded transition-all duration-150',
                isClickable
                    ? 'cursor-pointer hover:bg-white/8 active:scale-95 group'
                    : 'cursor-default'
            )}
            title={isClickable ? `Open ${item.name} in Terminal` : undefined}
        >
            <span className={cn(
                'text-[11px] font-semibold whitespace-nowrap transition-colors',
                isIndex ? 'text-gray-300' : 'text-gray-400',
                isClickable && 'group-hover:text-primary-400'
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
 * - Clicking any stock navigates to /terminal?symbol=SYMBOL.NS
 * - Marquee pauses on hover so the user can read/click comfortably
 * - Duplicates content so scroll loops seamlessly
 */
export default function MarketTickerBar() {
    const navigate = useNavigate();
    const tickerItems = useMarketIndicesStore((s) => s.tickerItems);
    const indices = useMarketIndicesStore((s) => s.indices);
    const isLoading = useMarketIndicesStore((s) => s.isLoading);
    const startPolling = useMarketIndicesStore((s) => s.startPolling);
    const stopPolling = useMarketIndicesStore((s) => s.stopPolling);
    const [paused, setPaused] = useState(false);
    const [tooltip, setTooltip] = useState(null); // { name, x }
    const tooltipTimeout = useRef(null);

    useEffect(() => {
        startPolling(60_000);
        return () => stopPolling();
    }, [startPolling, stopPolling]);

    // Use tickerItems if available, fall back to indices
    const items = tickerItems.length > 0 ? tickerItems : indices;

    if (isLoading || items.length === 0) return null;

    const handleClick = (item) => {
        // Ensure symbol ends with .NS for NSE stocks
        const symbol = item.symbol?.endsWith('.NS')
            ? item.symbol
            : `${item.symbol}.NS`;
        navigate(`/terminal?symbol=${encodeURIComponent(symbol)}`);
    };

    const handleMouseEnter = (item, e) => {
        if (item.kind === 'index') return;
        clearTimeout(tooltipTimeout.current);
        setTooltip({ name: `Click to open ${item.name} in Terminal`, x: e.clientX });
    };

    const handleMouseLeave = () => {
        tooltipTimeout.current = setTimeout(() => setTooltip(null), 150);
    };

    return (
        <div
            className="h-8 bg-surface-900/60 border-b border-edge/5 overflow-hidden flex items-center relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); setTooltip(null); }}
        >
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-900/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-900/90 to-transparent z-10 pointer-events-none" />

            {/* Floating tooltip */}
            {tooltip && (
                <div
                    className="fixed top-10 z-50 px-2.5 py-1.5 rounded-lg bg-surface-800 border border-primary-500/20 text-[11px] text-primary-300 font-medium shadow-xl pointer-events-none whitespace-nowrap"
                    style={{ left: Math.min(tooltip.x, window.innerWidth - 240) }}
                >
                    📈 {tooltip.name}
                </div>
            )}

            {/* Marquee track — two copies for seamless loop */}
            <div
                className="ticker-marquee flex items-center"
                style={{ animationPlayState: paused ? 'paused' : 'running' }}
            >
                {/* Copy A */}
                <div className="ticker-track flex items-center">
                    {items.map((item, i) => (
                        <div
                            key={`a-${i}`}
                            onMouseEnter={(e) => handleMouseEnter(item, e)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <TickerItem item={item} onClick={handleClick} />
                        </div>
                    ))}
                </div>
                {/* Copy B — aria-hidden duplicate for seamless loop */}
                <div className="ticker-track flex items-center" aria-hidden="true">
                    {items.map((item, i) => (
                        <div
                            key={`b-${i}`}
                            onMouseEnter={(e) => handleMouseEnter(item, e)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <TickerItem item={item} onClick={handleClick} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}