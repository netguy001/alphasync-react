import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiArrowRight, HiChartBar, HiLightningBolt, HiShieldCheck, HiGlobe } from 'react-icons/hi';

const features = [
    { icon: HiChartBar, title: 'Professional Charts', desc: 'Advanced candlestick charts with real NSE/BSE market data' },
    { icon: HiLightningBolt, title: 'Simulated Trading', desc: 'Execute market, limit, and stop-loss orders with ₹10L virtual capital' },
    { icon: HiShieldCheck, title: 'Risk-Free Learning', desc: 'Practice trading strategies without risking real money' },
    { icon: HiGlobe, title: 'Algo Trading', desc: 'Build, test, and deploy automated trading strategies' },
];

export default function LandingPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-surface-950 overflow-hidden">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 lg:px-12 h-16 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">α</div>
                    <span className="font-bold text-xl tracking-tight text-white">Alpha<span className="text-primary-400">Sync</span></span>
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 text-sm">
                            Go to Dashboard <HiArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Sign In</Link>
                            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section className="relative px-6 lg:px-12 pt-20 pb-32">
                {/* Glow effects */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-40 right-1/4 w-80 h-80 bg-accent-cyan/8 rounded-full blur-[100px]"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8 text-sm text-primary-400 font-medium">
                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></span>
                        Indian Stock Market Simulation Platform
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
                        <span className="text-white">Trade Like a Pro.</span>
                        <br />
                        <span className="text-gradient">Risk Nothing.</span>
                    </h1>

                    <p className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Professional-grade trading simulation with real NSE &amp; BSE market data.
                        Master the markets with ₹10,00,000 virtual capital and institutional-grade tools.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2 justify-center">
                            Start Trading Free <HiArrowRight className="w-5 h-5" />
                        </Link>
                        <Link to="/login" className="btn-secondary text-base px-8 py-3.5 justify-center">
                            Sign In to Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 lg:px-12 pb-24">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {features.map(({ icon: Icon, title, desc }, i) => (
                        <div key={i} className="glass-card-hover p-6 group">
                            <div className="w-11 h-11 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                                <Icon className="w-5 h-5 text-primary-400" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">{title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="px-6 lg:px-12 pb-24">
                <div className="max-w-4xl mx-auto glass-card p-8 flex flex-wrap justify-around gap-8">
                    {[
                        { val: '20+', label: 'NSE Stocks' },
                        { val: '₹10L', label: 'Virtual Capital' },
                        { val: 'Real-Time', label: 'Market Data' },
                        { val: 'Free', label: 'Forever' },
                    ].map(({ val, label }, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">{val}</div>
                            <div className="text-sm text-gray-500">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 px-6 lg:px-12 py-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center text-white font-bold text-xs">α</div>
                        <span className="text-sm text-gray-500">AlphaSync — Simulation Trading Platform</span>
                    </div>
                    <p className="text-xs text-gray-600">For educational purposes only. No real money involved.</p>
                </div>
            </footer>
        </div>
    );
}
