import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useZeroLossStore } from '../../stores/useZeroLossStore';
import { getAvailableStrategies, runEngine } from '../engine';

// -- Colour tokens ----------------------------------------------------------------
const SIG = {
    Bullish: { pill: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400', bar: 'bg-emerald-500' },
    Bearish: { pill: 'bg-red-500/15 text-red-400', dot: 'bg-red-400', bar: 'bg-red-500' },
    Neutral: { pill: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400', bar: 'bg-amber-500' },
};

const BIAS = {
    BULLISH: { bg: 'from-emerald-500/10 to-transparent', text: 'text-emerald-400', icon: '\u25b2', label: 'Bullish' },
    BEARISH: { bg: 'from-red-500/10 to-transparent', text: 'text-red-400', icon: '\u25bc', label: 'Bearish' },
    NEUTRAL: { bg: 'from-amber-500/8 to-transparent', text: 'text-amber-400', icon: '\u2014', label: 'Neutral' },
};

const LS_KEY = 'alphasync_strategy_enabled';
const LS_POS_KEY = 'alphasync_strategy_dock_pos';

const loadEnabled = () => { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveEnabled = (m) => { try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch { /* */ } };
const loadPos = () => { try { const r = localStorage.getItem(LS_POS_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const savePos = (p) => { try { localStorage.setItem(LS_POS_KEY, JSON.stringify(p)); } catch { /* */ } };

// -- Sub-components ----------------------------------------------------------------

function SignalBadge({ signal }) {
    const s = SIG[signal] || SIG.Neutral;
    return (
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded', s.pill)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
            {signal}
        </span>
    );
}

function ConfidenceBar({ value, signal }) {
    const s = SIG[signal] || SIG.Neutral;
    return (
        <div className="h-1 rounded-full bg-edge/[0.06] overflow-hidden w-full">
            <div
                className={cn('h-full rounded-full transition-all duration-500 ease-out', s.bar)}
                style={{ width: `${Math.max(value, 4)}%` }}
            />
        </div>
    );
}

function StrategyRow({ meta, result, enabled, onToggle }) {
    return (
        <div className={cn(
            'rounded-lg transition-all duration-150',
            enabled ? 'bg-edge/[0.02] hover:bg-edge/[0.04]' : 'opacity-40',
        )}>
            <div className="flex items-center gap-2.5 px-3 py-2">
                <button
                    onClick={onToggle}
                    className={cn(
                        'w-8 h-[18px] rounded-full relative flex-shrink-0 transition-colors duration-200 border',
                        enabled ? 'bg-primary-500/80 border-primary-500/50' : 'bg-edge/10 border-edge/10',
                    )}
                >
                    <span className={cn(
                        'absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-transform duration-200',
                        enabled ? 'translate-x-[15px]' : 'translate-x-[2px]',
                    )} />
                </button>
                <span className="flex-1 text-[11px] font-semibold text-gray-300 truncate leading-tight">{meta.name}</span>
                <span className="text-[10px] text-gray-600 font-mono tabular-nums w-7 text-right flex-shrink-0">
                    {Math.round((meta.weight || 0.1) * 100)}%
                </span>
                {enabled && result && <SignalBadge signal={result.signal} />}
            </div>
            {enabled && result && (
                <div className="px-3 pb-2 space-y-1">
                    <ConfidenceBar value={result.confidence} signal={result.signal} />
                    {result.detail && (
                        <p className="text-[9px] text-gray-600 leading-snug truncate ml-[42px]">{result.detail}</p>
                    )}
                </div>
            )}
        </div>
    );
}


// == STRATEGY DOCK -- Floating popup (draggable) ==================================

export default function StrategyDock({ candles = [], isOpen = false, onClose }) {
    const selectedSymbol = candles && candles.length > 0 && candles[candles.length - 1].symbol ? candles[candles.length - 1].symbol : null;
    const zeroLossForSymbol = useZeroLossStore((s) => selectedSymbol ? s.confidence[selectedSymbol] || null : null);
    const allStrategies = useMemo(() => getAvailableStrategies(), []);

    const [enabledMap, setEnabledMap] = useState(() => {
        const saved = loadEnabled();
        if (saved) return saved;
        const d = {};
        allStrategies.forEach((s) => { d[s.id] = true; });
        return d;
    });

    const toggle = useCallback((id) => {
        setEnabledMap((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            saveEnabled(next);
            return next;
        });
    }, []);

    const enabledIds = useMemo(
        () => allStrategies.filter((s) => enabledMap[s.id]).map((s) => s.id),
        [allStrategies, enabledMap],
    );

    const engine = useMemo(() => runEngine(candles, enabledIds), [candles, enabledIds]);

    const resultMap = useMemo(() => {
        const m = {};
        engine.signals.forEach((s) => { m[s.id] = s; });
        return m;
    }, [engine]);

    const b = BIAS[engine.overall] || BIAS.NEUTRAL;
    const bulls = engine.signals.filter((s) => s.signal === 'Bullish').length;
    const bears = engine.signals.filter((s) => s.signal === 'Bearish').length;

    // -- Dragging ------------------------------------------------------------------
    const panelRef = useRef(null);
    const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
    const [pos, setPos] = useState(() => loadPos() || { x: Math.max(280, window.innerWidth - 360), y: 100 });

    const clamp = useCallback((p) => ({
        x: Math.max(0, Math.min(window.innerWidth - 320, p.x)),
        y: Math.max(0, Math.min(window.innerHeight - 120, p.y)),
    }), []);

    const onGrab = useCallback((e) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        e.preventDefault();
        drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
        const move = (ev) => {
            if (!drag.current.active) return;
            setPos(clamp({
                x: drag.current.ox + (ev.clientX - drag.current.sx),
                y: drag.current.oy + (ev.clientY - drag.current.sy),
            }));
        };
        const up = () => {
            drag.current.active = false;
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            setPos((p) => { savePos(p); return p; });
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }, [pos, clamp]);

    useEffect(() => {
        const h = () => setPos((p) => clamp(p));
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, [clamp]);

    const neutrals = engine.signals.length - bulls - bears;
    const total = engine.signals.length || 1;

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="fixed z-50 flex flex-col rounded-2xl border border-edge/[0.06] bg-surface-900/95 backdrop-blur-2xl shadow-2xl shadow-black/60 select-none"
            style={{ left: pos.x, top: pos.y, width: 340 }}
        >
            {/* -- Title bar (drag handle) ----------------------------------------- */}
            <div
                onMouseDown={onGrab}
                className="flex items-center justify-between px-4 py-2 cursor-move border-b border-edge/[0.04]"
            >
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary-500/15 flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Strategy Engine</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600 font-mono mr-1.5">{enabledIds.length}/{allStrategies.length}</span>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-edge/5 transition-colors group" title="Close">
                        <svg className="w-3.5 h-3.5 text-gray-600 group-hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* -- Market Bias hero ------------------------------------------------ */}
            <div className={cn('mx-3 mt-3 rounded-xl p-3 bg-gradient-to-br', b.bg)}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Market Bias</p>
                        <div className="flex items-center gap-1.5">
                            <span className={cn('text-xl font-black tracking-tight', b.text)}>{b.icon}</span>
                            <span className={cn('text-base font-extrabold uppercase tracking-wide', b.text)}>{b.label}</span>
                        </div>
                    </div>
                    <div className="text-right space-y-0.5">
                        <div>
                            <span className="text-[9px] text-gray-600">Score </span>
                            <span className={cn('text-sm font-bold font-mono', b.text)}>
                                {engine.weightedScore >= 0 ? '+' : ''}{engine.weightedScore}
                            </span>
                        </div>
                        <div>
                            <span className="text-[9px] text-gray-600">Conf </span>
                            <span className={cn('text-xs font-bold font-mono', b.text)}>{engine.confidence}%</span>
                        </div>
                    </div>
                </div>
                {zeroLossForSymbol && (
                    <div className="mt-3 text-sm text-gray-300 border-t border-edge/5 pt-3">
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-semibold">ZeroLoss (backend)</div>
                            <div className="text-xs font-mono">
                                <span className="mr-3">{zeroLossForSymbol.direction}</span>
                                <span className="font-bold">{Math.round(zeroLossForSymbol.score)}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signal distribution bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mt-2.5 bg-edge/[0.04]">
                    {bulls > 0 && <div className="bg-emerald-500/80 transition-all duration-500" style={{ width: `${(bulls / total) * 100}%` }} />}
                    {neutrals > 0 && <div className="bg-amber-500/50 transition-all duration-500" style={{ width: `${(neutrals / total) * 100}%` }} />}
                    {bears > 0 && <div className="bg-red-500/80 transition-all duration-500" style={{ width: `${(bears / total) * 100}%` }} />}
                </div>

                {/* Bull / Bear / Neutral counts */}
                <div className="flex items-center gap-3 mt-2 pt-1.5">
                    <span className="text-[10px] font-semibold text-emerald-400">{bulls} Bull</span>
                    <span className="text-[10px] font-semibold text-red-400">{bears} Bear</span>
                    <span className="text-[10px] font-semibold text-gray-500">{neutrals} Flat</span>
                    <div className="flex-1" />
                    <span className="text-[9px] text-gray-600 font-mono">{(engine.score ?? 0) >= 0 ? '+' : ''}{engine.score ?? 0}%</span>
                </div>
            </div>

            {/* -- Strategy rows --------------------------------------------------- */}
            <div className="px-3 py-2.5 space-y-1 max-h-[320px] overflow-y-auto scrollbar-none">
                {allStrategies.map((meta) => (
                    <StrategyRow
                        key={meta.id}
                        meta={meta}
                        result={resultMap[meta.id]}
                        enabled={!!enabledMap[meta.id]}
                        onToggle={() => toggle(meta.id)}
                    />
                ))}
            </div>

            {/* -- Footer ---------------------------------------------------------- */}
            <div className="px-4 py-2 border-t border-edge/[0.03] text-center">
                <p className="text-[9px] text-gray-700 leading-relaxed">
                    Weighted scoring {'\u00b7'} {'>'}+0.3 Bullish {'\u00b7'} {'<'}-0.3 Bearish
                </p>
            </div>
        </div>
    );
}
