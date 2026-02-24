import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [needs2FA, setNeeds2FA] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(email, password, needs2FA ? totpCode : null);
            if (result.requires2FA) {
                setNeeds2FA(true);
                toast('Enter your 2FA code to continue', { icon: '🔐' });
            } else if (result.success) {
                toast.success('Welcome back!');
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-950 flex">
            {/* Left: Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">α</div>
                        <span className="font-bold text-2xl tracking-tight text-heading">Alpha<span className="text-primary-400">Sync</span></span>
                    </div>

                    <h1 className="text-2xl font-bold text-heading mb-2">Welcome back</h1>
                    <p className="text-gray-500 mb-8">Sign in to access your trading terminal</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label-text">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com" required
                                    className="input-field pl-12" />
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password" required
                                    className="input-field pl-12 pr-12" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {needs2FA && (
                            <div className="animate-slide-up">
                                <label className="label-text">2FA Code</label>
                                <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)}
                                    placeholder="Enter 6-digit code" maxLength={6}
                                    className="input-field text-center text-lg tracking-[0.5em] font-mono" />
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : (needs2FA ? 'Verify & Sign In' : 'Sign In')}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-8">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Create Account</Link>
                    </p>
                </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden lg:flex flex-1 bg-surface-900/50 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-cyan/5"></div>
                <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px]"></div>
                <div className="relative text-center p-12">
                    <div className="text-6xl font-extrabold text-heading/10 mb-4">₹10,00,000</div>
                    <p className="text-gray-500 text-lg">Virtual capital to practice trading</p>
                    <div className="mt-8 flex justify-center gap-6">
                        {['NIFTY 50', 'SENSEX', 'BANK NIFTY'].map(idx => (
                            <div key={idx} className="glass-card px-4 py-3">
                                <div className="text-xs text-gray-500">{idx}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
