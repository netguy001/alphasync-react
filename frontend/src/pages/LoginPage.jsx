import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiArrowRight, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [needs2FA, setNeeds2FA] = useState(false);
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(email, password, needs2FA ? totpCode : null);
            if (result.requires2FA) { setNeeds2FA(true); toast('Enter your 2FA code to continue', { icon: '🔒' }); }
            else if (result.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed');
        } finally { setLoading(false); }
    };

    const inputCls = "w-full pl-11 pr-4 py-3 bg-surface-900/80 border border-edge/10 rounded-lg text-heading placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 text-sm transition-all";

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2.5">
                        <img src="/logo.png" alt="AlphaSync" className="h-16 rounded-xl object-contain dark:brightness-100 brightness-0" />
                    </Link>
                    <h1 className="text-2xl font-bold text-heading mt-6 mb-1">Welcome back</h1>
                    <p className="text-gray-500 text-sm">Sign in to your trading account</p>
                </div>

                {/* Form Card */}
                <div className="glass-card p-6 lg:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label-text">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com" required className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className="label-text">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password" required className={inputCls + ' !pr-11'} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                    {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {needs2FA && (
                            <div>
                                <label className="label-text">2FA Code</label>
                                <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                                    placeholder="000000" maxLength={6}
                                    className="input-field text-center text-2xl tracking-widest font-mono !border-primary-500/30" />
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                            {loading
                                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                                : <>{needs2FA ? 'Verify & Sign In' : 'Sign In'}<HiArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                </div>

                {/* Footer links */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Create Account</Link>
                </p>
                <p className="text-center text-gray-600 text-xs mt-4 flex items-center justify-center gap-1.5">
                    <HiShieldCheck className="w-3.5 h-3.5 text-profit/60" /> All data is simulated. No real money involved.
                </p>
            </div>
        </div>
    );
}
