import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout';
import ProtectedRoute from './components/ProtectedRoute';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TradingTerminalPage = lazy(() => import('./pages/TradingTerminalPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AlgoTradingPage = lazy(() => import('./pages/AlgoTradingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

/** Full-screen spinner shown during lazy chunk loading */
function PageSkeleton() {
    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Suspense fallback={<PageSkeleton />}>
                        <Routes>
                            {/* ── Public ── */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* ── Protected (inside AppShell) ── */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <AppShell />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/terminal" element={<TradingTerminalPage />} />
                                <Route path="/portfolio" element={<PortfolioPage />} />
                                <Route path="/algo" element={<AlgoTradingPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>

                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgb(var(--surface-700))',
                            color: 'rgb(var(--c-heading))',
                            border: '1px solid rgb(var(--c-edge) / 0.08)',
                            fontSize: '14px',
                            borderRadius: '10px',
                        },
                        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
            </AuthProvider>
        </ThemeProvider>
    );
}
