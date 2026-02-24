import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MarketTickerBar from './MarketTickerBar';
import { cn } from '../../utils/cn';
import { LS_SIDEBAR } from '../../utils/constants';

/**
 * Root authenticated shell: sidebar + navbar + market ticker + page content.
 *
 * Layout grid (desktop):
 *   [Fixed Sidebar 240/72px] [Main: Navbar 56px / TickerBar 36px / Page overflow-y-auto]
 *
 * Mobile: sidebar becomes a full-width overlay drawer; main content stays at 0 margin.
 */
export default function AppShell() {
    const location = useLocation();

    // ── Sidebar state — persisted to localStorage ─────────────────────────────
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const stored = localStorage.getItem(LS_SIDEBAR);
        if (stored !== null) return stored === 'true';
        return window.innerWidth < 1024; // default: collapsed on mobile
    });

    const toggle = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(LS_SIDEBAR, String(next));
            return next;
        });
    };

    // ── Auto-close sidebar on mobile when navigating ──────────────────────────
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
            localStorage.setItem(LS_SIDEBAR, 'true');
        }
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-surface-950 flex">
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggle} />

            {/*
             * Main content area:
             * - On desktop (lg+): left margin matches sidebar width, transitions with it.
             * - On mobile:        no margin — sidebar overlays via fixed positioning.
             */}
            <div
                className={cn(
                    'flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out',
                    sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
                )}
            >
                <Navbar onMenuToggle={toggle} />
                <MarketTickerBar />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
