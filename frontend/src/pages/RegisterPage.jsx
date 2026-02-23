import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ email: '', username: '', password: '', confirmPassword: '', full_name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (formData.password.length < 8) {
            return toast.error('Password must be at least 8 characters');
        }
        setLoading(true);
        try {
            const { confirmPassword, ...data } = formData;
            await register(data);
            toast.success('Account created! Welcome to AlphaSync.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-950 flex">
            {/* Left: Visual */}
            <div className="hidden lg:flex flex-1 bg-surface-900/50 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-emerald/5 to-primary-500/5"></div>
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent-emerald/10 rounded-full blur-[100px]"></div>
                <div className="relative text-center p-12">
                    <h2 className="text-4xl font-bold text-heading mb-4">Start Your<br /><span className="text-gradient">Trading Journey</span></h2>
                    <p className="text-gray-500 text-lg max-w-md">Practice with real market data, execute simulated trades, and build your portfolio — risk free.</p>
                    <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        {[
                            { label: 'Virtual Capital', val: '₹10L' },
                            { label: 'NSE Stocks', val: '20+' },
                            { label: 'Order Types', val: '4' },
                            { label: 'Algo Strategies', val: '∞' },
                        ].map(({ label, val }) => (
                            <div key={label} className="glass-card p-4 text-center">
                                <div className="text-xl font-bold text-heading">{val}</div>
                                <div className="text-xs text-gray-500 mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">α</div>
                        <span className="font-bold text-2xl tracking-tight text-heading">Alpha<span className="text-primary-400">Sync</span></span>
                    </div>

                    <h1 className="text-2xl font-bold text-heading mb-2">Create your account</h1>
                    <p className="text-gray-500 mb-8">Join AlphaSync and start trading with ₹10,00,000 virtual capital</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label-text">Full Name</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type="text" value={formData.full_name} onChange={set('full_name')} placeholder="Your full name" required className="input-field pl-12" />
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                                <input type="text" value={formData.username} onChange={set('username')} placeholder="Choose a username" required className="input-field pl-12" />
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Email Address</label>
                            <div className="relative">
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type="email" value={formData.email} onChange={set('email')} placeholder="you@example.com" required className="input-field pl-12" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-text">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={set('password')} placeholder="Min 8 chars" required minLength={8} className="input-field" />
                                </div>
                            </div>
                            <div>
                                <label className="label-text">Confirm</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter" required className="input-field" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" onClick={() => setShowPassword(!showPassword)} className="rounded bg-surface-800 border-edge/10" />
                            <span className="text-xs text-gray-500">Show passwords</span>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
