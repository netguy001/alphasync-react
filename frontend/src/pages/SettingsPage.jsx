import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    HiOutlineShieldCheck, HiOutlineUser, HiOutlineLockClosed,
    HiOutlineMoon, HiOutlineSun, HiCheckCircle,
} from 'react-icons/hi';

const TABS = [
    { id: 'profile', label: 'Profile', icon: HiOutlineUser },
    { id: 'security', label: 'Security', icon: HiOutlineLockClosed },
    { id: 'appearance', label: 'Appearance', icon: HiOutlineSun },
    { id: '2fa', label: '2FA', icon: HiOutlineShieldCheck },
];

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState({ full_name: '', phone: '' });
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [twoFA, setTwoFA] = useState({ setup: null, code: '', enabled: false });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user) setProfile({ full_name: user.full_name || '', phone: '' });
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
        <div className="p-4 lg:p-6 max-w-4xl animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-heading">Settings</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
                {/* Tab sidebar */}
                <div className="flex sm:flex-col gap-1 sm:w-40 flex-shrink-0 overflow-x-auto sm:overflow-visible">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                ${activeTab === id
                                    ? 'bg-primary-600/15 text-primary-400 border-l-2 border-primary-500'
                                    : 'text-gray-400 hover:text-heading hover:bg-overlay/5 border-l-2 border-transparent'
                                }`}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Profile */}
                    {activeTab === 'profile' && (
                        <div className="glass-card p-6">
                            <h2 className="text-sm font-semibold text-heading mb-5">Profile Information</h2>
                            <form onSubmit={updateProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-text">Email</label>
                                        <input type="email" value={user?.email || ''} disabled className="input-field opacity-60 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="label-text">Username</label>
                                        <input type="text" value={user?.username || ''} disabled className="input-field opacity-60 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="label-text">Full Name</label>
                                        <input type="text" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label-text">Phone Number</label>
                                        <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 00000 00000" className="input-field" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary text-sm">
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === 'security' && (
                        <div className="glass-card p-6">
                            <h2 className="text-sm font-semibold text-heading mb-5">Change Password</h2>
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
                                <button type="submit" disabled={loading} className="btn-primary text-sm">
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Appearance */}
                    {activeTab === 'appearance' && (
                        <div className="glass-card p-6">
                            <h2 className="text-sm font-semibold text-heading mb-5">Appearance</h2>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-900/40 border border-edge/[0.03]">
                                <div className="flex items-center gap-3">
                                    {theme === 'dark'
                                        ? <HiOutlineMoon className="w-5 h-5 text-primary-400" />
                                        : <HiOutlineSun className="w-5 h-5 text-amber-400" />}
                                    <div>
                                        <div className="text-sm font-medium text-heading">Color Theme</div>
                                        <div className="text-xs text-gray-500 capitalize">{theme} mode</div>
                                    </div>
                                </div>
                                <button onClick={toggleTheme}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-amber-400'}`}>
                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${theme === 'dark' ? 'left-0.5' : 'left-6'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2FA */}
                    {activeTab === '2fa' && (
                        <div className="glass-card p-6">
                            <h2 className="text-sm font-semibold text-heading mb-1">Two-Factor Authentication</h2>
                            <p className="text-xs text-gray-500 mb-5">Add an extra layer of security</p>

                            {twoFA.enabled ? (
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-profit/10 border border-profit/20 text-profit">
                                    <HiCheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-semibold">2FA is enabled</span>
                                </div>
                            ) : twoFA.setup ? (
                                <div className="space-y-5">
                                    <p className="text-sm text-gray-400">Scan the QR code with your authenticator app:</p>
                                    <div className="w-fit bg-white p-3 rounded-xl">
                                        <img src={`data:image/png;base64,${twoFA.setup.qr_code}`} alt="2FA QR" className="w-44 h-44" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2">Or enter this secret manually:</p>
                                        <code className="text-sm text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg font-mono border border-primary-500/20">{twoFA.setup.secret}</code>
                                    </div>
                                    <div>
                                        <label className="label-text">Verification Code</label>
                                        <div className="flex gap-3">
                                            <input type="text" value={twoFA.code} onChange={e => setTwoFA(p => ({ ...p, code: e.target.value }))}
                                                maxLength={6} placeholder="000000"
                                                className="input-field w-40 text-center font-mono text-lg tracking-[0.5em]" />
                                            <button onClick={verify2FA} className="btn-primary text-sm">Verify &amp; Enable</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/8 border border-amber-500/15 mb-5">
                                        <HiOutlineShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-300/80">Your account is not protected by 2FA. Enable it to secure your account.</p>
                                    </div>
                                    <button onClick={setup2FA} className="btn-primary text-sm inline-flex items-center gap-2">
                                        <HiOutlineShieldCheck className="w-4 h-4" /> Setup 2FA
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
