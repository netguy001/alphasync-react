import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { HiTrendingUp, HiTrendingDown, HiDotsVertical } from 'react-icons/hi';

/**
 * Single watchlist row with price-flash animation on LTP change.
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
    const btnRef = useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

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

    // ── Close context menu on outside click or scroll ─────────────────────────
    useEffect(() => {
        if (!showMenu) return;
        const close = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        const closeOnScroll = () => setShowMenu(false);
        document.addEventListener('mousedown', close);
        window.addEventListener('scroll', closeOnScroll, true);
        window.addEventListener('resize', closeOnScroll);
        return () => {
            document.removeEventListener('mousedown', close);
            window.removeEventListener('scroll', closeOnScroll, true);
            window.removeEventListener('resize', closeOnScroll);
        };
    }, [showMenu]);

    // ── Toggle menu and calculate position ────────────────────────────────────
    const toggleMenu = useCallback((e) => {
        e.stopPropagation();
        if (!showMenu && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const menuW = 144; // w-36
            const menuH = 120; // approx height
            const spaceBelow = window.innerHeight - rect.bottom;
            setMenuPos({
                top: spaceBelow > menuH ? rect.bottom + 4 : rect.top - menuH - 4,
                left: Math.max(8, rect.right - menuW),
            });
        }
        setShowMenu((v) => !v);
    }, [showMenu]);

    const openMenuFromContext = useCallback((e) => {
        e.preventDefault();
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const menuW = 144;
            const menuH = 120;
            const spaceBelow = window.innerHeight - rect.bottom;
            setMenuPos({
                top: spaceBelow > menuH ? rect.bottom + 4 : rect.top - menuH - 4,
                left: Math.max(8, rect.right - menuW),
            });
        }
        setShowMenu(true);
    }, []);

    const changePositive = (price?.change ?? 0) >= 0;
    const symbol = item.symbol?.replace('.NS', '');

    return (
        <div
            onClick={onSelect}
            onContextMenu={openMenuFromContext}
            className={cn(
                'relative flex items-center justify-between px-3 py-2 cursor-pointer',
                'border-b border-edge/[0.03] transition-colors duration-150',
                'hover:bg-white/[0.025] group',
                isSelected && 'bg-primary-600/10 border-l-2 border-l-primary-500',
                flashClass
            )}
        >
            {/* Left: symbol + name */}
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-heading truncate">{symbol}</div>
                <div className="text-[10px] text-gray-600 truncate leading-tight">
                    {item.company_name || item.exchange || 'NSE'}
                </div>
            </div>

            {/* Right: price + change */}
            <div className="flex flex-col items-end ml-1 flex-shrink-0">
                <span className="text-[13px] font-mono font-semibold text-heading tabular-nums">
                    {price?.price != null ? formatPrice(price.price) : '—'}
                </span>
                <span className={cn(
                    'flex items-center gap-0.5 text-[10px] font-mono',
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

            {/* Context menu trigger — visible on hover */}
            <button
                ref={btnRef}
                onClick={toggleMenu}
                className="ml-0.5 p-0.5 rounded text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="More options"
            >
                <HiDotsVertical className="w-3.5 h-3.5" />
            </button>

            {/* Context menu — rendered via portal so it's not clipped by scroll overflow */}
            {showMenu && createPortal(
                <div
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: menuPos.top, left: menuPos.left }}
                    className="fixed w-36 bg-surface-800 border border-edge/10 rounded-lg shadow-xl z-[9999] overflow-hidden animate-slide-in"
                >
                    <button onClick={() => { onBuy(item.symbol); setShowMenu(false); }}
                        className="w-full px-3 py-2 text-xs text-left text-bull hover:bg-bull/10 transition-colors font-medium">
                        Buy {symbol}
                    </button>
                    <button onClick={() => { onSell(item.symbol); setShowMenu(false); }}
                        className="w-full px-3 py-2 text-xs text-left text-bear hover:bg-bear/10 transition-colors font-medium">
                        Sell {symbol}
                    </button>
                    <div className="border-t border-edge/10 my-0.5" />
                    <button onClick={() => { onRemove(item.id); setShowMenu(false); }}
                        className="w-full px-3 py-2 text-xs text-left text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        Remove
                    </button>
                </div>,
                document.body
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
