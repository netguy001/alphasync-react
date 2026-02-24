import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { SIDEBAR_EXPANDED_W, SIDEBAR_COLLAPSED_W } from '../../utils/constants';
import {
    HiOutlineViewGrid,
    HiOutlineChartBar,
    HiOutlineBriefcase,
    HiOutlineLightningBolt,
    HiOutlineCog,
    HiOutlineLogout,
    HiChevronLeft,
    HiChevronRight,
} from 'react-icons/hi';

const NAV_ITEMS = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/terminal', icon: HiOutlineChartBar, label: 'Terminal' },
    { to: '/portfolio', icon: HiOutlineBriefcase, label: 'Portfolio' },
    { to: '/algo', icon: HiOutlineLightningBolt, label: 'Algo Trading' },
    { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

/**
 * Fixed collapsible sidebar.
 * Width: 240px expanded / 72px collapsed.
 * Mobile: full-width drawer with backdrop overlay.
 *
 * @param {{ collapsed: boolean, onToggle: () => void }} props
 */
export default function Sidebar({ collapsed, onToggle }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <>
            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}

            <aside
                style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
                className={cn(
                    'fixed left-0 top-0 h-screen z-40 flex flex-col',
                    'bg-surface-900/95 backdrop-blur-xl border-r border-edge/5',
                    'transition-all duration-300 ease-in-out overflow-hidden',
                    // Mobile: hide when collapsed, slide in when open
                    collapsed ? 'max-lg:-translate-x-full' : 'max-lg:translate-x-0 max-lg:w-[240px]'
                )}
            >
                {/* Logo row */}
                <div className="flex items-center h-14 border-b border-edge/5 flex-shrink-0 px-4 gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan
                        flex items-center justify-center text-white font-bold text-lg
                        shadow-lg shadow-primary-500/20 flex-shrink-0">
                        α
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-lg tracking-tight text-heading whitespace-nowrap flex-1 overflow-hidden">
                            Alpha<span className="text-primary-400">Sync</span>
                        </span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            title={collapsed ? label : undefined}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                    'border-l-2 text-sm font-medium',
                                    collapsed && 'justify-center',
                                    isActive
                                        ? 'bg-primary-600/15 text-primary-400 border-primary-500'
                                        : 'text-gray-400 hover:text-heading hover:bg-white/5 border-transparent'
                                )
                            }
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User + logout */}
                <div className="p-2 border-t border-edge/5 flex-shrink-0">
                    {!collapsed && user && (
                        <div className="px-3 py-2 mb-1">
                            <p className="text-sm font-medium text-heading truncate">
                                {user.full_name || user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title={collapsed ? 'Log Out' : undefined}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
                            'text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200',
                            collapsed && 'justify-center'
                        )}
                    >
                        <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* Desktop collapse/expand tab — pinned to sidebar right edge, always visible */}
            <button
                onClick={onToggle}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{ left: (collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W) - 10 }}
                className={cn(
                    'hidden lg:flex items-center justify-center',
                    'fixed top-[18px] z-50',
                    'w-5 h-5 rounded-full',
                    'bg-surface-700 hover:bg-primary-600 border border-edge/20',
                    'text-gray-400 hover:text-white shadow-md',
                    'transition-all duration-300 ease-in-out'
                )}
            >
                {collapsed ? <HiChevronRight className="w-3 h-3" /> : <HiChevronLeft className="w-3 h-3" />}
            </button>
        </>
    );
}
