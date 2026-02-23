import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMoon, HiOutlineSun, HiMenu } from 'react-icons/hi';

export default function Header({ onMenuToggle }) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="h-14 bg-surface-900/80 backdrop-blur-xl border-b border-white/5
      flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">

            <div className="flex items-center gap-4">
                <button onClick={onMenuToggle} className="lg:hidden text-gray-400 hover:text-white">
                    <HiMenu className="w-6 h-6" />
                </button>

                {/* Search */}
                <div className="relative hidden sm:block">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search stocks... (e.g. RELIANCE, TCS)"
                        className="bg-surface-800/60 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm
              text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/30
              w-[320px] transition-all duration-200"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600
            bg-surface-700 px-1.5 py-0.5 rounded font-mono">/</kbd>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Market Status */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 mr-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-subtle"></div>
                    <span className="text-xs text-gray-400 font-medium">Market Closed</span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    {theme === 'dark' ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all relative">
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
