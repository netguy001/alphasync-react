import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineLockClosed, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';

export default function SettingsPage() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState({ full_name: '', phone: '' });
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [twoFA, setTwoFA] = useState({ setup: null, code: '', enabled: false });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({ full_name: user.full_name || '', phone: '' });
        }
    }, [user]);

    const updateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/profile', profile);
            toast.success('Profile updated');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Update failed');
        }
        setLoading(false);
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
        if (passwords.newPass.length < 8) return toast.error('Password must be at least 8 characters');
        setLoading(true);
        try {
            await api.put('/user/password', { current_password: passwords.current, new_password: passwords.newPass });
            toast.success('Password changed');
            setPasswords({ current: '', newPass: '', confirm: '' });
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed');
        }
        setLoading(false);
    };

    const setup2FA = async () => {
        try {
            const res = await api.post('/auth/2fa/setup');
            setTwoFA(prev => ({ ...prev, setup: res.data }));
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed');
        }
    };

    const verify2FA = async () => {
        try {
            await api.post('/auth/2fa/verify', { code: twoFA.code });
            toast.success('2FA enabled!');
            setTwoFA({ setup: null, code: '', enabled: true });
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid code');
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-3xl animate-fade-in">
            <h1 className="text-2xl font-bold text-heading">Settings</h1>

            {/* Profile */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                    <HiOutlineUser className="w-5 h-5 text-primary-400" />
                    <h2 className="font-semibold text-heading">Profile</h2>
                </div>
                <form onSubmit={updateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Email</label>
                            <input type="email" value={user?.email || ''} disabled className="input-field opacity-50 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="label-text">Username</label>
                            <input type="text" value={user?.username || ''} disabled className="input-field opacity-50 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="label-text">Full Name</label>
                            <input type="text" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="input-field" />
                        </div>
                        <div>
                            <label className="label-text">Phone</label>
                            <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91" className="input-field" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary text-sm">Save Profile</button>
                </form>
            </div>

            {/* Theme */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {theme === 'dark' ? <HiOutlineMoon className="w-5 h-5 text-primary-400" /> : <HiOutlineSun className="w-5 h-5 text-amber-400" />}
                        <div>
                            <h2 className="font-semibold text-heading">Theme</h2>
                            <p className="text-sm text-gray-500">Currently using {theme} mode</p>
                        </div>
                    </div>
                    <button onClick={toggleTheme}
                        className="relative w-14 h-7 rounded-full bg-surface-700 transition-colors"
                    >
                        <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 ${theme === 'dark' ? 'left-1 bg-primary-500' : 'left-8 bg-amber-400'}`}></div>
                    </button>
                </div>
            </div>

            {/* Password */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                    <HiOutlineLockClosed className="w-5 h-5 text-primary-400" />
                    <h2 className="font-semibold text-heading">Change Password</h2>
                </div>
                <form onSubmit={changePassword} className="space-y-4">
                    <div>
                        <label className="label-text">Current Password</label>
                        <input type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required className="input-field" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">New Password</label>
                            <input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} required minLength={8} className="input-field" />
                        </div>
                        <div>
                            <label className="label-text">Confirm New Password</label>
                            <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required className="input-field" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary text-sm">Change Password</button>
                </form>
            </div>

            {/* 2FA */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                    <HiOutlineShieldCheck className="w-5 h-5 text-primary-400" />
                    <h2 className="font-semibold text-heading">Two-Factor Authentication</h2>
                </div>

                {twoFA.enabled ? (
                    <div className="flex items-center gap-2 text-profit">
                        <HiOutlineShieldCheck className="w-5 h-5" /> 2FA is enabled
                    </div>
                ) : twoFA.setup ? (
                    <div className="space-y-4 animate-slide-up">
                        <p className="text-sm text-gray-400">Scan this QR code with Google Authenticator or Authy:</p>
                        <div className="bg-white p-4 rounded-lg inline-block">
                            <img src={`data:image/png;base64,${twoFA.setup.qr_code}`} alt="2FA QR Code" className="w-48 h-48" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Or enter this secret manually:</p>
                            <code className="text-sm text-primary-400 bg-surface-800 px-3 py-1.5 rounded font-mono">{twoFA.setup.secret}</code>
                        </div>
                        <div>
                            <label className="label-text">Enter 6-digit code to verify</label>
                            <div className="flex gap-3">
                                <input type="text" value={twoFA.code} onChange={e => setTwoFA(p => ({ ...p, code: e.target.value }))}
                                    maxLength={6} placeholder="000000" className="input-field w-40 text-center font-mono text-lg tracking-[0.5em]" />
                                <button onClick={verify2FA} className="btn-primary text-sm">Verify & Enable</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account</p>
                        <button onClick={setup2FA} className="btn-secondary text-sm inline-flex items-center gap-2">
                            <HiOutlineShieldCheck className="w-4 h-4" /> Setup 2FA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
