import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
    const location = useLocation();

    // Collapse sidebar on mobile whenever route changes
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
        }
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-surface-950">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'}`}>
                <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <main className="min-h-[calc(100vh-56px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
