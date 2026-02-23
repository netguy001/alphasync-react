import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TradingTerminalPage from './pages/TradingTerminalPage';
import PortfolioPage from './pages/PortfolioPage';
import AlgoTradingPage from './pages/AlgoTradingPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected */}
                        <Route element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/terminal" element={<TradingTerminalPage />} />
                            <Route path="/portfolio" element={<PortfolioPage />} />
                            <Route path="/algo" element={<AlgoTradingPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgb(var(--surface-700))',
                            color: 'rgb(var(--c-heading))',
                            border: '1px solid rgb(var(--c-edge) / 0.05)',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
            </AuthProvider>
        </ThemeProvider>
    );
}
