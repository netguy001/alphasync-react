import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { cn } from '../../utils/cn';
import { SIDEBAR_EXPANDED_W, SIDEBAR_COLLAPSED_W } from '../../utils/constants';
import {
    LuLayoutDashboard,
    LuChartCandlestick,
    LuBriefcase,
    LuBot,
    LuShield,
    LuSettings,
    LuLogOut,
    LuUser,
    LuPanelLeftClose,
    LuPanelLeftOpen,
} from 'react-icons/lu';

/* ─── Section definitions ────────────────────────────────── */
const NAV_SECTIONS = [
    {
        label: 'Main',
        items: [
            { to: '/dashboard', icon: LuLayoutDashboard, label: 'Dashboard' },
            { to: '/terminal', icon: LuChartCandlestick, label: 'Terminal' },
        ],
    },
    {
        label: 'Trading',
        items: [
            { to: '/portfolio', icon: LuBriefcase, label: 'Portfolio' },
            { to: '/algo', icon: LuBot, label: 'Algo Trading' },
            { to: '/zeroloss', icon: LuShield, label: 'ZeroLoss' },
        ],
    },
    {
        label: 'System',
        items: [
            { to: '/settings', icon: LuSettings, label: 'Settings' },
        ],
    },
];

/* ─── Reusable nav item ──────────────────────────────────── */
function SidebarItem({ to, icon: Icon, label, collapsed }) {
    return (
        <NavLink
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
                cn(
                    'relative flex items-center h-10 rounded-md transition-all duration-200 ease-out',
                    'text-[13px] font-medium',
                    collapsed ? 'justify-center mx-auto w-full' : 'gap-3 px-3',
                    isActive
                        ? 'bg-primary-600/10 text-primary-400'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                )
            }
        >
            {({ isActive }) => (
                <>
                    {/* Active indicator bar — pinned to sidebar left edge */}
                    {isActive && (
                        <span
                            className="absolute top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500"
                            style={{ left: collapsed ? -10 : -10 }}
                        />
                    )}
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span
                        className={cn(
                            'whitespace-nowrap transition-all duration-200',
                            collapsed
                                ? 'w-0 opacity-0 overflow-hidden'
                                : 'w-auto opacity-100'
                        )}
                    >
                        {label}
                    </span>
                </>
            )}
        </NavLink>
    );
}

/* ─── Section label ──────────────────────────────────────── */
function SectionLabel({ label, collapsed }) {
    if (collapsed) return <div className="h-2" />;
    return (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 select-none">
            {label}
        </p>
    );
}

/**
 * Fixed collapsible sidebar — institutional-grade navigation.
 * Width: 240px expanded / 72px collapsed.
 * Mobile: full-width drawer with backdrop overlay.
 *
 * @param {{ collapsed: boolean, onToggle: () => void }} props
 */
export default function Sidebar({ collapsed, onToggle }) {
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <>
            {/* Mobile overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-[2px]"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}

            <aside
                style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
                className={cn(
                    'fixed left-0 top-0 h-screen z-40 flex flex-col',
                    'bg-surface-900 border-r border-edge/10',
                    'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden',
                    collapsed ? 'max-lg:-translate-x-full' : 'max-lg:translate-x-0 max-lg:w-[240px]'
                )}
            >
                {/* ── Brand row ── */}
                <div
                    className={cn(
                        'flex-shrink-0 transition-all duration-300',
                        collapsed
                            ? 'flex flex-col items-center gap-1.5 py-3 px-2'
                            : 'flex items-center justify-between h-16 px-3'
                    )}
                >
                    <img
                        src={collapsed ? '/logo1.png' : '/logo.png'}
                        alt="AlphaSync"
                        className={cn(
                            'dark:brightness-100 brightness-0 object-contain flex-shrink-0 transition-all duration-300',
                            collapsed ? 'h-8 w-8' : 'h-14'
                        )}
                    />
                    <button
                        onClick={onToggle}
                        className="rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all duration-200 p-1.5 flex-shrink-0"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed
                            ? <LuPanelLeftOpen className="w-4 h-4" />
                            : <LuPanelLeftClose className="w-4 h-4" />}
                    </button>
                </div>

                {/* ── Divider ── */}
                <div className="mx-3 h-px bg-edge/8" />

                {/* ── Navigation ── */}
                <nav className="flex-1 px-2.5 overflow-y-auto overflow-x-hidden">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <SectionLabel label={section.label} collapsed={collapsed} />
                            <div className="space-y-0.5">
                                {section.items.map((item) => (
                                    <SidebarItem key={item.to} {...item} collapsed={collapsed} />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── Divider ── */}
                <div className="mx-3 h-px bg-edge/8" />

                {/* ── Account module ── */}
                <div className="flex-shrink-0 p-2.5">
                    {/* User info */}
                    {user && (
                        <div
                            className={cn(
                                'flex items-center rounded-md mb-1 transition-all duration-200',
                                collapsed
                                    ? 'justify-center py-2'
                                    : 'gap-2.5 px-3 py-2.5 hover:bg-white/[0.03]'
                            )}
                            title={collapsed ? `${user.full_name || user.username}\n${user.email}` : undefined}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-600/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                                <LuUser className="w-3.5 h-3.5 text-primary-400" />
                            </div>
                            <div className={cn(
                                'min-w-0 transition-all duration-200',
                                collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                            )}>
                                <p className="text-[13px] font-medium text-heading truncate leading-tight">
                                    {user.full_name || user.username}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        title={collapsed ? 'Log Out' : undefined}
                        className={cn(
                            'flex items-center h-10 rounded-md w-full transition-all duration-200',
                            'text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06]',
                            collapsed ? 'justify-center' : 'gap-3 px-3'
                        )}
                    >
                        <LuLogOut className="w-[18px] h-[18px] flex-shrink-0" />
                        <span className={cn(
                            'text-[13px] font-medium whitespace-nowrap transition-all duration-200',
                            collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                        )}>
                            Log Out
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
