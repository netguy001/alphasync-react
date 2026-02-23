import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-surface-950">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'} max-lg:ml-0`}>
                <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <main className="min-h-[calc(100vh-56px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
