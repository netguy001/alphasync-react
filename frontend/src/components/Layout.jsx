import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
    // Desktop: start expanded; Mobile: start collapsed (hidden)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
    const location = useLocation();

    // Auto-close on mobile when navigating
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
        }
    }, [location.pathname]);

    const toggle = () => setSidebarCollapsed(prev => !prev);

    return (
        <div className="min-h-screen bg-surface-950 flex">
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggle} />

            {/* Main content — offset left margin to clear the fixed sidebar on desktop */}
            <div
                className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out
                    ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}
            >
                <Header onMenuToggle={toggle} sidebarCollapsed={sidebarCollapsed} />
                <main className="flex-1 min-h-[calc(100vh-56px)] overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
