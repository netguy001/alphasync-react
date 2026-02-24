import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMarketStore } from '../../store/useMarketStore';
import api from '../../services/api';
import Badge from '../ui/Badge';
import { cn } from '../../utils/cn';
import { MARKET_STATE_LABEL } from '../../utils/constants';
import {
    HiOutlineSearch,
    HiOutlineBell,
    HiOutlineMoon,
    HiOutlineSun,
    HiMenu,
} from 'react-icons/hi';

/**
 * Fixed top navigation bar — 56px tall.
 * Hosts: menu toggle, global search, market status, WS status, theme toggle, user avatar.
 */
export default function Navbar({ onMenuToggle }) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const wsStatus = useMarketStore((s) => s.wsStatus);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [marketStatus, setMarketStatus] = useState({ state: 'closed', is_trading: false });
    const searchRef = useRef(null);

    // ── Market session polling ────────────────────────────────────────────────
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/health');
                if (res.data?.market_session) setMarketStatus(res.data.market_session);
            } catch { /* ignore */ }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 60_000);
        return () => clearInterval(interval);
    }, []);

    // ── Symbol search (debounced 300ms) ───────────────────────────────────────
    useEffect(() => {
        if (searchQuery.length < 1) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await api.get(`/market/search?q=${searchQuery}`);
                setSearchResults(res.data.results || []);
                setShowResults(true);
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // ── Reset search on route change ──────────────────────────────────────────
    useEffect(() => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    }, [location.pathname]);

    // ── Close search on outside click ─────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
                setSearchQuery('');
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelectStock = useCallback((symbol) => {
        setSearchQuery('');
        setShowResults(false);
        navigate(`/terminal?symbol=${symbol}`);
    }, [navigate]);

    // ── Derived display values ─────────────────────────────────────────────────
    const isMarketOpen = marketStatus.is_trading;
    const statusText = MARKET_STATE_LABEL[marketStatus.state] ?? 'Market Closed';
    const statusColor = isMarketOpen ? 'bg-green-400' : 'bg-amber-400';

    const wsColor = {
        connected: 'bg-green-400',
        connecting: 'bg-amber-400 animate-pulse',
        disconnected: 'bg-gray-500',
        error: 'bg-red-400',
    }[wsStatus];
    const wsLabel = { connected: 'Live', connecting: 'Connecting', disconnected: 'Offline', error: 'Error' }[wsStatus];

    return (
        <header
            className={cn(
                'h-14 bg-surface-900/80 backdrop-blur-xl border-b border-edge/5',
                'flex items-center justify-between px-4 lg:px-6',
                'sticky top-0 z-30'
            )}
        >
            {/* Simulation mode badge — centred */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:block pointer-events-none">
                <span
                    className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full
                        text-xs font-semibold uppercase tracking-wide pointer-events-auto cursor-default"
                    title="Trading with virtual money. No real funds involved."
                >
                    Simulation Mode
                </span>
            </div>

            {/* Left: hamburger + search */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="text-gray-400 hover:text-heading p-1.5 rounded-lg hover:bg-white/5 transition-all"
                    aria-label="Toggle sidebar"
                >
                    <HiMenu className="w-5 h-5" />
                </button>

                {/* Stock search */}
                <div className="relative hidden sm:block" ref={searchRef}>
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setSearchQuery('');
                                setSearchResults([]);
                                setShowResults(false);
                            }
                        }}
                        placeholder="Search stocks… (e.g. RELIANCE, TCS)"
                        aria-label="Stock search"
                        className={cn(
                            'w-[300px] lg:w-[340px] bg-surface-800/60 border border-edge/5 rounded-lg',
                            'pl-10 pr-10 py-2 text-sm text-heading placeholder-gray-500',
                            'focus:outline-none focus:border-primary-500/30 transition-all duration-200'
                        )}
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-surface-700 px-1.5 py-0.5 rounded font-mono">
                        /
                    </kbd>

                    {/* Autocomplete dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-edge/10 rounded-xl shadow-panel z-50 max-h-[280px] overflow-y-auto animate-slide-in">
                            {searchResults.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleSelectStock(stock.symbol)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-overlay/5 transition-colors text-left border-b border-edge/5 last:border-0"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-heading">
                                            {stock.symbol.replace('.NS', '')}
                                        </div>
                                        <div className="text-xs text-gray-500">{stock.name}</div>
                                    </div>
                                    <span className="text-xs text-gray-600 bg-surface-700 px-1.5 py-0.5 rounded">
                                        {stock.exchange}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: market status, WS status, theme, bell, avatar */}
            <div className="flex items-center gap-1.5">
                {/* Market status */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 mr-1">
                    <div className={cn('w-2 h-2 rounded-full', statusColor, isMarketOpen && 'animate-pulse')} />
                    <span className="text-xs text-gray-400 font-medium">{statusText}</span>
                </div>

                {/* WebSocket status */}
                <div
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-800/40 mr-1"
                    title={`WebSocket: ${wsStatus}`}
                >
                    <div className={cn('w-1.5 h-1.5 rounded-full', wsColor)} />
                    <span className="text-xs text-gray-500">{wsLabel}</span>
                </div>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-400 hover:text-heading hover:bg-overlay/5 transition-all"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark'
                        ? <HiOutlineSun className="w-5 h-5" />
                        : <HiOutlineMoon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <button
                    className="p-2 rounded-lg text-gray-400 hover:text-heading hover:bg-overlay/5 transition-all relative"
                    aria-label="Notifications"
                >
                    <HiOutlineBell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
                </button>

                {/* User avatar */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700
                    flex items-center justify-center text-white text-sm font-bold ml-1 cursor-pointer select-none">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
            </div>
        </header>
    );
}
