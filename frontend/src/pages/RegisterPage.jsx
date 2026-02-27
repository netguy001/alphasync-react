import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff, HiArrowRight, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '', full_name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
        if (formData.password.length < 8) return toast.error('Password must be at least 8 characters');
        setLoading(true);
        try {
            const { confirmPassword, ...data } = formData;
            await register(data);
            toast.success('Account created! Welcome to AlphaSync.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed');
        } finally { setLoading(false); }
    };

    const inputCls = "w-full px-4 py-3 bg-surface-900/80 border border-edge/10 rounded-lg text-heading placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 text-sm transition-all";

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2.5">
                        <img src="/logo.png" alt="AlphaSync" className="h-16 rounded-xl object-contain dark:brightness-100 brightness-0" />
                    </Link>
                    <h1 className="text-2xl font-bold text-heading mt-6 mb-1">Create your account</h1>
                    <p className="text-gray-500 text-sm">Start trading with ₹10,00,000 virtual capital</p>
                </div>

                {/* Form Card */}
                <div className="glass-card p-6 lg:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-text">Full Name</label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input type="text" value={formData.full_name} onChange={set('full_name')}
                                        placeholder="Full name" required className={inputCls + ' pl-10'} />
                                </div>
                            </div>
                            <div>
                                <label className="label-text">Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">@</span>
                                    <input type="text" value={formData.username} onChange={set('username')}
                                        placeholder="username" required className={inputCls + ' pl-8'} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type="email" value={formData.email} onChange={set('email')}
                                    placeholder="you@example.com" required className={inputCls + ' pl-10'} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-text">Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={set('password')}
                                        placeholder="Min 8 chars" required minLength={8} className={inputCls + ' pl-10 pr-10'} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                        {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="label-text">Confirm Password</label>
                                <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={set('confirmPassword')}
                                    placeholder="Re-enter" required className={inputCls} />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                            {loading
                                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
                                : <>Create Free Account <HiArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign In</Link>
                </p>
                <p className="text-center text-gray-600 text-xs mt-4 flex items-center justify-center gap-1.5">
                    <HiShieldCheck className="w-3.5 h-3.5 text-profit/60" /> Free forever. No credit card required.
                </p>
            </div>
        </div>
    );
}
