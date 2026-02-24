import { memo, useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { HiTrendingUp, HiTrendingDown, HiDotsVertical } from 'react-icons/hi';

/**
 * Single watchlist row with price-flash animation on LTP change.
 *
 * @param {{
 *   item: { id: number, symbol: string, company_name?: string },
 *   price: { price?: number, change?: number, change_percent?: number },
 *   isSelected: boolean,
 *   onSelect: () => void,
 *   onRemove: (id: number) => void,
 *   onBuy:  (symbol: string) => void,
 *   onSell: (symbol: string) => void,
 * }} props
 */
const WatchlistItem = memo(function WatchlistItem({
    item,
    price = {},
    isSelected,
    onSelect,
    onRemove,
    onBuy,
    onSell,
}) {
    const [flashClass, setFlashClass] = useState('');
    const prevPriceRef = useRef(price?.price);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // ── Price flash animation ─────────────────────────────────────────────────
    useEffect(() => {
        const prev = prevPriceRef.current;
        const curr = price?.price;
        if (prev !== undefined && curr !== undefined && prev !== curr) {
            const cls = curr > prev ? 'animate-price-up' : 'animate-price-down';
            setFlashClass(cls);
            const t = setTimeout(() => setFlashClass(''), 650);
            prevPriceRef.current = curr;
            return () => clearTimeout(t);
        }
        prevPriceRef.current = curr;
    }, [price?.price]);

    // ── Close context menu on outside click ───────────────────────────────────
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    const changePositive = (price?.change ?? 0) >= 0;
    const symbol = item.symbol?.replace('.NS', '');

    return (
        <div
            onClick={onSelect}
            onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
            className={cn(
                'relative flex items-center justify-between px-3 py-2.5 cursor-pointer',
                'border-b border-edge/[0.03] transition-colors duration-150',
                'hover:bg-white/[0.025]',
                isSelected && 'bg-primary-600/10 border-l-2 border-l-primary-500',
                flashClass
            )}
        >
            {/* Left: symbol + name */}
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-heading truncate">{symbol}</div>
                <div className="text-[11px] text-gray-600 truncate">
                    {item.company_name || item.exchange || ''}
                </div>
            </div>

            {/* Right: price + change */}
            <div className="flex flex-col items-end ml-2 flex-shrink-0">
                <span className="text-sm font-mono font-semibold text-heading tabular-nums">
                    {price?.price != null ? formatPrice(price.price) : '—'}
                </span>
                <span className={cn(
                    'flex items-center gap-0.5 text-[11px] font-mono',
                    changePositive ? 'text-bull' : 'text-bear'
                )}>
                    {changePositive
                        ? <HiTrendingUp className="w-2.5 h-2.5" />
                        : <HiTrendingDown className="w-2.5 h-2.5" />}
                    {price?.change_percent != null
                        ? formatPercent(price.change_percent, 2)
                        : '—'}
                </span>
            </div>

            {/* Context menu trigger */}
            <button
                onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
                className="ml-1 p-1 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="More options"
            >
                <HiDotsVertical className="w-3.5 h-3.5" />
            </button>

            {/* Context menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-full mt-0.5 w-36 bg-surface-700 border border-edge/10 rounded-lg shadow-panel z-50 overflow-hidden animate-slide-in"
                >
                    <button onClick={() => { onBuy(item.symbol); setShowMenu(false); }} className="w-full px-3 py-2 text-xs text-left text-bull hover:bg-bull/10 transition-colors">Buy {symbol}</button>
                    <button onClick={() => { onSell(item.symbol); setShowMenu(false); }} className="w-full px-3 py-2 text-xs text-left text-bear hover:bg-bear/10 transition-colors">Sell {symbol}</button>
                    <div className="border-t border-edge/5" />
                    <button onClick={() => { onRemove(item.id); setShowMenu(false); }} className="w-full px-3 py-2 text-xs text-left text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">Remove</button>
                </div>
            )}
        </div>
    );
}, (prev, next) =>
    prev.price?.price === next.price?.price &&
    prev.price?.change_percent === next.price?.change_percent &&
    prev.isSelected === next.isSelected &&
    prev.item.id === next.item.id
);

export default WatchlistItem;
