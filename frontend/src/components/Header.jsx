import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMoon, HiOutlineSun, HiMenu } from 'react-icons/hi';

export default function Header({ onMenuToggle, sidebarCollapsed }) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [marketStatus, setMarketStatus] = useState({ state: 'closed', is_trading: false });
    const searchRef = useRef(null);

    // Fetch market session status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/health');
                if (res.data?.market_session) {
                    setMarketStatus(res.data.market_session);
                }
            } catch { /* ignore */ }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // Search stocks
    useEffect(() => {
        if (searchQuery.length < 1) { setSearchResults([]); return; }
        const timeout = setTimeout(async () => {
            try {
                const res = await api.get(`/market/search?q=${searchQuery}`);
                setSearchResults(res.data.results || []);
                setShowResults(true);
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Close search on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelectStock = (symbol) => {
        setSearchQuery('');
        setShowResults(false);
        navigate(`/terminal?symbol=${symbol}`);
    };

    const statusColor = marketStatus.is_trading ? 'bg-green-400' : 'bg-amber-400';
    const statusText = marketStatus.state === 'open' ? 'Market Open' :
        marketStatus.state === 'pre_market' ? 'Pre-Market' :
            marketStatus.state === 'closing' ? 'Closing' :
                marketStatus.state === 'after_market' ? 'After Hours' :
                    marketStatus.state === 'weekend' ? 'Weekend' :
                        marketStatus.state === 'holiday' ? 'Holiday' :
                            marketStatus.simulation_mode ? 'Simulation' : 'Market Closed';

    return (
        <header className="h-14 bg-surface-900/80 backdrop-blur-xl border-b border-edge/5
      flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">

            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuToggle}
                    className="text-gray-400 hover:text-heading p-1.5 rounded-lg hover:bg-white/5 transition-all"
                    title="Toggle sidebar"
                >
                    <HiMenu className="w-5 h-5" />
                </button>

                {/* Search */}
                <div className="relative hidden sm:block" ref={searchRef}>
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                        placeholder="Search stocks... (e.g. RELIANCE, TCS)"
                        className="bg-surface-800/60 border border-edge/5 rounded-lg pl-10 pr-4 py-2 text-sm
              text-heading placeholder-gray-500 focus:outline-none focus:border-primary-500/30
              w-[320px] transition-all duration-200"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600
            bg-surface-700 px-1.5 py-0.5 rounded font-mono">/</kbd>

                    {/* Search Results Dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-edge/10 rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto">
                            {searchResults.map((stock) => (
                                <button
                                    key={stock.symbol}
                                    onClick={() => handleSelectStock(stock.symbol)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-overlay/5 transition-colors text-left"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-heading">{stock.symbol.replace('.NS', '')}</div>
                                        <div className="text-xs text-gray-500">{stock.name}</div>
                                    </div>
                                    <span className="text-xs text-gray-600">{stock.exchange}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Market Status */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 mr-2">
                    <div className={`w-2 h-2 rounded-full ${statusColor} ${marketStatus.is_trading ? 'animate-pulse' : 'animate-pulse-subtle'}`}></div>
                    <span className="text-xs text-gray-400 font-medium">{statusText}</span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-400 hover:text-heading hover:bg-overlay/5 transition-all"
                >
                    {theme === 'dark' ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <button className="p-2 rounded-lg text-gray-400 hover:text-heading hover:bg-overlay/5 transition-all relative">
                    <HiOutlineBell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
                </button>

                {/* User Avatar */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700
          flex items-center justify-center text-white text-sm font-bold ml-1 cursor-pointer">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
            </div>
        </header>
    );
}
