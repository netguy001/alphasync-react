import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineViewGrid,
    HiOutlineChartBar,
    HiOutlineBriefcase,
    HiOutlineLightningBolt,
    HiOutlineCog,
    HiOutlineLogout,
} from 'react-icons/hi';

const navItems = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/terminal', icon: HiOutlineChartBar, label: 'Terminal' },
    { to: '/portfolio', icon: HiOutlineBriefcase, label: 'Portfolio' },
    { to: '/algo', icon: HiOutlineLightningBolt, label: 'Algo Trading' },
    { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={`fixed left-0 top-0 h-screen z-40 flex flex-col
      bg-surface-900/95 backdrop-blur-xl border-r border-white/5
      transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan
          flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
                    α
                </div>
                {!collapsed && (
                    <span className="font-bold text-lg tracking-tight text-white">
                        Alpha<span className="text-primary-400">Sync</span>
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive
                                ? 'bg-primary-600/15 text-primary-400 border-l-2 border-primary-500 ml-0'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`
                        }
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-white/5">
                {!collapsed && user && (
                    <div className="px-3 py-2 mb-2">
                        <p className="text-sm font-medium text-white truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400
            hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
                >
                    <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Log Out</span>}
                </button>
            </div>
        </aside>
    );
}
