import { useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import WatchlistItem from './WatchlistItem';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import { HiOutlineSearch, HiOutlinePlus, HiX } from 'react-icons/hi';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Watchlist panel with virtual scroll (handles 100+ items), symbol search,
 * per-item context menu (buy/sell/remove), and live price display.
 *
 * @param {{
 *   watchlistId: number|null,
 *   items: Array,
 *   prices: Record<string, object>,
 *   selectedSymbol: string,
 *   isLoading: boolean,
 *   onSelectSymbol: (symbol: string) => void,
 *   onItemsChange: (items: Array) => void,
 *   onBuy:  (symbol: string) => void,
 *   onSell: (symbol: string) => void,
 * }} props
 */
export default function Watchlist({
    watchlistId,
    items = [],
    prices = {},
    selectedSymbol,
    isLoading = false,
    onSelectSymbol,
    onItemsChange,
    onBuy,
    onSell,
    onClose,
}) {
    const [search, setSearch] = useState('');
    const [addSearch, setAddSearch] = useState('');
    const [addResults, setAddResults] = useState([]);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const addRef = useRef(null);
    const scrollEl = useRef(null);

    // ── Filter items by search ────────────────────────────────────────────────
    const filtered = items.filter((item) =>
        search.length === 0 ||
        item.symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(search.toLowerCase())
    );

    // ── Virtual scroll ────────────────────────────────────────────────────────
    const rowVirtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => scrollEl.current,
        estimateSize: () => 52,
        overscan: 5,
    });

    // ── Symbol search for "add" panel ─────────────────────────────────────────
    useEffect(() => {
        if (addSearch.length < 1) { setAddResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await api.get(`/market/search?q=${addSearch}`);
                setAddResults(res.data.results || []);
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(t);
    }, [addSearch]);

    // ── Close add panel on outside click ──────────────────────────────────────
    useEffect(() => {
        if (!showAddPanel) return;
        const handler = (e) => {
            if (addRef.current && !addRef.current.contains(e.target)) {
                setShowAddPanel(false);
                setAddSearch('');
                setAddResults([]);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showAddPanel]);

    // ── Add symbol to watchlist ────────────────────────────────────────────────
    const handleAdd = useCallback(async (symbol) => {
        if (!watchlistId) return;
        try {
            const res = await api.post(`/watchlist/${watchlistId}/items`, { symbol });
            onItemsChange([...items, res.data]);
            toast.success(`${symbol.replace('.NS', '')} added`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Already in watchlist');
        }
        setShowAddPanel(false);
        setAddSearch('');
        setAddResults([]);
    }, [watchlistId, items, onItemsChange]);

    // ── Remove symbol from watchlist ──────────────────────────────────────────
    const handleRemove = useCallback(async (itemId) => {
        if (!watchlistId) return;
        try {
            await api.delete(`/watchlist/${watchlistId}/items/${itemId}`);
            onItemsChange(items.filter((i) => i.id !== itemId));
        } catch { /* ignore */ }
    }, [watchlistId, items, onItemsChange]);

    return (
        <div className="flex flex-col h-full border-r border-edge/5 bg-surface-900/60">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-edge/5 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                            Watchlist
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="relative" ref={addRef}>
                            <button
                                onClick={() => setShowAddPanel((v) => !v)}
                                className="p-1 rounded text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                                aria-label="Add symbol"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                            </button>

                            {/* Add panel dropdown */}
                            {showAddPanel && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-surface-800 border border-edge/10 rounded-xl shadow-panel z-50 animate-slide-in">
                                    <div className="p-2 border-b border-edge/5">
                                        <div className="relative">
                                            <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                            <input
                                                autoFocus
                                                value={addSearch}
                                                onChange={(e) => setAddSearch(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Escape' && setShowAddPanel(false)}
                                                placeholder="Search symbol…"
                                                className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-900/60 border border-edge/10 rounded-lg text-heading placeholder-gray-500 focus:outline-none focus:border-primary-500/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {addResults.map((s) => (
                                            <button
                                                key={s.symbol}
                                                onClick={() => handleAdd(s.symbol)}
                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-overlay/5 text-left border-b border-edge/[0.03] last:border-0 transition-colors"
                                            >
                                                <div>
                                                    <div className="text-xs font-semibold text-heading">{s.symbol.replace('.NS', '')}</div>
                                                    <div className="text-[11px] text-gray-500 truncate max-w-[160px]">{s.name}</div>
                                                </div>
                                                <HiOutlinePlus className="w-3.5 h-3.5 text-primary-400" />
                                            </button>
                                        ))}
                                        {addSearch.length > 0 && addResults.length === 0 && (
                                            <div className="px-3 py-4 text-xs text-gray-600 text-center">No results</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg bg-surface-700/80 border border-edge/20 text-gray-300 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/30 transition-all duration-200"
                                title="Hide watchlist"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 19l-7-7 7-7" />
                                    <path d="M18 5l-6 7 6 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter input */}
                <div className="relative">
                    <HiOutlineSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter…"
                        className="w-full pl-7 pr-7 py-1.5 text-xs bg-surface-800/40 border border-edge/5 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500/20"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                        >
                            <HiX className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div
                ref={scrollEl}
                className="flex-1 overflow-y-auto overflow-x-hidden"
            >
                {isLoading ? (
                    <div className="space-y-0">
                        {Array.from({ length: 8 }, (_, i) => (
                            <Skeleton key={i} variant="watchlist-row" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-600 text-xs">
                        <p>{search ? 'No matches found' : 'Your watchlist is empty'}</p>
                        {!search && (
                            <button
                                onClick={() => setShowAddPanel(true)}
                                className="mt-2 text-primary-400 hover:underline"
                            >
                                + Add symbols
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        style={{ height: rowVirtualizer.getTotalSize() }}
                        className="relative"
                    >
                        {rowVirtualizer.getVirtualItems().map((vRow) => {
                            const item = filtered[vRow.index];
                            const price = prices[item.symbol] ?? {};
                            return (
                                <div
                                    key={vRow.key}
                                    data-index={vRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    style={{ transform: `translateY(${vRow.start}px)` }}
                                    className="absolute top-0 left-0 w-full group"
                                >
                                    <WatchlistItem
                                        item={item}
                                        price={price}
                                        isSelected={item.symbol === selectedSymbol}
                                        onSelect={() => onSelectSymbol?.(item.symbol)}
                                        onRemove={handleRemove}
                                        onBuy={onBuy}
                                        onSell={onSell}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer count */}
            <div className="px-3 py-1.5 border-t border-edge/5 text-[11px] text-gray-600">
                {filtered.length} / {items.length} symbols
            </div>
        </div>
    );
}
