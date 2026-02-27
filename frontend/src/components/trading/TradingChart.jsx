import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { HiTrendingUp, HiTrendingDown, HiMinusCircle } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import Skeleton from '../ui/Skeleton';
import { CHART_PERIODS } from '../../utils/constants';
import {
    sma, ema, rsi, macd, bollingerBands, vwap,
    supertrend, atr, stochastic, ichimoku,
} from '../../strategy/indicators';

// ── Constants ─────────────────────────────────────────────────────────────────

const TREND_STYLE = {
    BULLISH: {
        badge: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
        icon: '▲', label: 'BULLISH', glow: 'shadow-emerald-500/10',
    },
    BEARISH: {
        badge: 'bg-red-500/15 border-red-500/25 text-red-400',
        icon: '▼', label: 'BEARISH', glow: 'shadow-red-500/10',
    },
    NEUTRAL: {
        badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        icon: '—', label: 'NEUTRAL', glow: 'shadow-amber-500/10',
    },
};

/** Indicator catalogue — each entry knows how to compute and render itself */
const INDICATOR_DEFS = {
    ema20: { label: 'EMA 20', group: 'Moving Averages', color: '#F59E0B', width: 1.5 },
    ema50: { label: 'EMA 50', group: 'Moving Averages', color: '#8B5CF6', width: 1.5 },
    ema200: { label: 'EMA 200', group: 'Moving Averages', color: '#EC4899', width: 1.5 },
    sma20: { label: 'SMA 20', group: 'Moving Averages', color: '#06B6D4', width: 1.5 },
    sma50: { label: 'SMA 50', group: 'Moving Averages', color: '#14B8A6', width: 1.5 },
    sma200: { label: 'SMA 200', group: 'Moving Averages', color: '#F472B6', width: 1.5 },
    bb: { label: 'Bollinger Bands', group: 'Bands', color: '#6366F1', width: 1 },
    vwap: { label: 'VWAP', group: 'Volume', color: '#A855F7', width: 2 },
    supertrend: { label: 'SuperTrend', group: 'Trend', color: '#10B981', width: 2 },
    ichimoku: { label: 'Ichimoku Cloud', group: 'Trend', color: '#F97316', width: 1 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeOverlay(id, candles) {
    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    const toLine = (vals, clr, w = 1.5) => ({
        data: vals.map((v, i) => (isNaN(v) ? null : { time: times[i], value: v })).filter(Boolean),
        color: clr,
        width: w,
    });

    switch (id) {
        case 'ema20': return [toLine(ema(closes, 20), INDICATOR_DEFS.ema20.color, INDICATOR_DEFS.ema20.width)];
        case 'ema50': return [toLine(ema(closes, 50), INDICATOR_DEFS.ema50.color, INDICATOR_DEFS.ema50.width)];
        case 'ema200': return [toLine(ema(closes, 200), INDICATOR_DEFS.ema200.color, INDICATOR_DEFS.ema200.width)];
        case 'sma20': return [toLine(sma(closes, 20), INDICATOR_DEFS.sma20.color, INDICATOR_DEFS.sma20.width)];
        case 'sma50': return [toLine(sma(closes, 50), INDICATOR_DEFS.sma50.color, INDICATOR_DEFS.sma50.width)];
        case 'sma200': return [toLine(sma(closes, 200), INDICATOR_DEFS.sma200.color, INDICATOR_DEFS.sma200.width)];
        case 'vwap': return [toLine(vwap(candles), INDICATOR_DEFS.vwap.color, INDICATOR_DEFS.vwap.width)];
        case 'bb': {
            const { upper, middle, lower } = bollingerBands(closes, 20, 2);
            return [
                toLine(upper, '#818CF8', 1),
                toLine(middle, '#6366F1', 1),
                toLine(lower, '#818CF8', 1),
            ];
        }
        case 'supertrend': {
            const { supertrend: st, direction: dir } = supertrend(candles, 10, 3);
            // Split into bull/bear segments for colouring
            const bullData = [], bearData = [];
            st.forEach((v, i) => {
                if (isNaN(v)) return;
                const pt = { time: times[i], value: v };
                if (dir[i] === 1) { bullData.push(pt); bearData.push({ time: times[i], value: v }); }
                else { bearData.push(pt); bullData.push({ time: times[i], value: v }); }
            });
            return [
                { data: bullData, color: '#10B981', width: 2 },
                { data: bearData, color: '#EF4444', width: 2 },
            ];
        }
        case 'ichimoku': {
            const { tenkan: tk, kijun: kj, senkouA: sa, senkouB: sb } = ichimoku(candles, 9, 26, 52);
            return [
                toLine(tk, '#2DD4BF', 1),
                toLine(kj, '#F87171', 1),
                toLine(sa, '#A3E635', 1),
                toLine(sb, '#FB923C', 1),
            ];
        }
        default: return [];
    }
}

// ── Toolbar sub-components ────────────────────────────────────────────────────

function TimeframeBar({ period, onPeriodChange }) {
    return (
        <div className="flex items-center gap-0.5">
            {Object.entries(CHART_PERIODS).map(([key, cfg]) => (
                <button
                    key={key}
                    onClick={() => onPeriodChange(key)}
                    className={cn(
                        'px-2 py-1 text-[11px] font-semibold rounded transition-colors',
                        period === key
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-surface-800/60'
                    )}
                >
                    {cfg.label}
                </button>
            ))}
        </div>
    );
}

function IndicatorMenu({ active, onToggle, onClose }) {
    const groups = {};
    Object.entries(INDICATOR_DEFS).forEach(([id, def]) => {
        (groups[def.group] = groups[def.group] || []).push({ id, ...def });
    });

    return (
        <div className="absolute top-full left-0 mt-1 w-56 bg-surface-800 border border-edge/10 rounded-xl shadow-panel z-50 animate-slide-in overflow-hidden">
            <div className="px-3 py-2 border-b border-edge/5 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                Indicators
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
                {Object.entries(groups).map(([group, items]) => (
                    <div key={group}>
                        <div className="px-3 pt-2 pb-1 text-[10px] text-gray-600 uppercase tracking-wider font-medium">{group}</div>
                        {items.map((ind) => (
                            <button
                                key={ind.id}
                                onClick={() => onToggle(ind.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-overlay/5 transition-colors text-left"
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border"
                                    style={{
                                        backgroundColor: active.has(ind.id) ? ind.color : 'transparent',
                                        borderColor: ind.color,
                                    }}
                                />
                                <span className={cn('text-xs', active.has(ind.id) ? 'text-heading font-medium' : 'text-gray-400')}>
                                    {ind.label}
                                </span>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
            <div className="px-3 py-1.5 border-t border-edge/5">
                <button
                    onClick={() => { active.forEach((id) => onToggle(id)); }}
                    className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                    Clear all
                </button>
            </div>
        </div>
    );
}

function ToolsMenu({ activeTool, onSelect, onClose }) {
    const tools = [
        { id: 'crosshair', label: 'Crosshair', icon: '＋' },
        { id: 'hline', label: 'Horizontal Line', icon: '─' },
        { id: 'trendline', label: 'Trend Line', icon: '╱' },
        { id: 'measure', label: 'Measure', icon: '⤢' },
    ];

    return (
        <div className="absolute top-full left-0 mt-1 w-44 bg-surface-800 border border-edge/10 rounded-xl shadow-panel z-50 animate-slide-in overflow-hidden">
            <div className="px-3 py-2 border-b border-edge/5 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                Tools
            </div>
            <div className="py-1">
                {tools.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => { onSelect(activeTool === t.id ? null : t.id); onClose(); }}
                        className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 hover:bg-overlay/5 transition-colors text-left',
                            activeTool === t.id && 'bg-primary-500/10'
                        )}
                    >
                        <span className="w-5 text-center text-sm text-gray-400">{t.icon}</span>
                        <span className={cn('text-xs', activeTool === t.id ? 'text-primary-400 font-medium' : 'text-gray-400')}>
                            {t.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Active indicator pills (shown in toolbar) ────────────────────────────────
function ActivePills({ active, onRemove }) {
    if (active.size === 0) return null;
    return (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[...active].map((id) => {
                const def = INDICATOR_DEFS[id];
                if (!def) return null;
                return (
                    <span
                        key={id}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap"
                        style={{ borderColor: def.color + '40', color: def.color, backgroundColor: def.color + '10' }}
                    >
                        {def.label}
                        <button onClick={() => onRemove(id)} className="hover:opacity-60 leading-none">×</button>
                    </span>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── TradingChart main component ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const TradingChart = memo(function TradingChart({
    candles = [],
    isLoading = false,
    trendData = null,
    period = '1D',
    onPeriodChange,
    zeroLossTrend = null,
}) {
    const { theme } = useTheme();
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const roRef = useRef(null);
    const indicatorSeriesRef = useRef({}); // { [id]: [LineSeries, ...] }
    const drawingsRef = useRef([]);        // price lines / trend lines

    // ── Local state for toolbar ───────────────────────────────────────────────
    const [activeIndicators, setActiveIndicators] = useState(new Set());
    const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [hLines, setHLines] = useState([]);          // horizontal price lines
    const [trendPoints, setTrendPoints] = useState([]); // for trend line drawing

    // ── Close menus on outside click ──────────────────────────────────────────
    const menuRef = useRef(null);
    useEffect(() => {
        if (!showIndicatorMenu && !showToolsMenu) return;
        const h = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowIndicatorMenu(false);
                setShowToolsMenu(false);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [showIndicatorMenu, showToolsMenu]);

    // ── Toggle an indicator ───────────────────────────────────────────────────
    const toggleIndicator = useCallback((id) => {
        setActiveIndicators((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // ── Instantiate / destroy chart on theme change ───────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let cancelled = false;

        const initChart = async () => {
            const { createChart, ColorType } = await import('lightweight-charts');
            if (cancelled) return;

            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
                indicatorSeriesRef.current = {};
                drawingsRef.current = [];
            }

            const isDark = theme === 'dark';
            const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
            const scaleColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';

            const chart = createChart(containerRef.current, {
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#9ca3af',
                    fontSize: 12,
                    fontFamily: 'Inter, system-ui, sans-serif',
                },
                grid: {
                    vertLines: { color: gridColor },
                    horzLines: { color: gridColor },
                },
                rightPriceScale: { borderColor: scaleColor },
                timeScale: {
                    borderColor: scaleColor,
                    timeVisible: true,
                    secondsVisible: false,
                },
                crosshair: {
                    mode: 0,
                    vertLine: { color: 'rgba(99,102,241,0.4)', width: 1, style: 2 },
                    horzLine: { color: 'rgba(99,102,241,0.4)', width: 1, style: 2 },
                },
                handleScroll: { mouseWheel: true, pressedMouseMove: true },
                handleScale: { mouseWheel: true, pinch: true },
            });

            const series = chart.addCandlestickSeries({
                upColor: '#26A69A',
                downColor: '#EF5350',
                borderUpColor: '#26A69A',
                borderDownColor: '#EF5350',
                wickUpColor: '#26A69A',
                wickDownColor: '#EF5350',
            });

            if (candles.length > 0) {
                series.setData(candles);
                chart.timeScale().fitContent();
            }

            chartRef.current = chart;
            seriesRef.current = series;

            // ResizeObserver
            if (roRef.current) roRef.current.disconnect();
            roRef.current = new ResizeObserver(() => {
                if (containerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({
                        width: containerRef.current.clientWidth,
                        height: containerRef.current.clientHeight,
                    });
                }
            });
            roRef.current.observe(containerRef.current);
        };

        initChart();

        return () => {
            cancelled = true;
            if (roRef.current) roRef.current.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
                indicatorSeriesRef.current = {};
            }
        };
    }, [theme]);

    // ── Update candle data ────────────────────────────────────────────────────
    useEffect(() => {
        if (!seriesRef.current || candles.length === 0) return;
        seriesRef.current.setData(candles);
        chartRef.current?.timeScale().fitContent();
    }, [candles]);

    // ── Render / remove indicator overlays ────────────────────────────────────
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || candles.length === 0) return;

        // Remove old series that are no longer active
        Object.keys(indicatorSeriesRef.current).forEach((id) => {
            if (!activeIndicators.has(id)) {
                indicatorSeriesRef.current[id].forEach((s) => {
                    try { chart.removeSeries(s); } catch { /* already removed */ }
                });
                delete indicatorSeriesRef.current[id];
            }
        });

        // Add / update active indicators
        activeIndicators.forEach((id) => {
            const lines = computeOverlay(id, candles);
            if (lines.length === 0) return;

            // If series already exist, just update data
            if (indicatorSeriesRef.current[id]) {
                indicatorSeriesRef.current[id].forEach((s, i) => {
                    if (lines[i]) {
                        try { s.setData(lines[i].data); } catch { /* ignore */ }
                    }
                });
                return;
            }

            // Create new line series
            const created = lines.map((line) => {
                const s = chart.addLineSeries({
                    color: line.color,
                    lineWidth: line.width,
                    priceLineVisible: false,
                    lastValueVisible: false,
                    crosshairMarkerVisible: false,
                });
                s.setData(line.data);
                return s;
            });
            indicatorSeriesRef.current[id] = created;
        });
    }, [activeIndicators, candles]);

    // ── Chart click handler for tools ─────────────────────────────────────────
    useEffect(() => {
        const chart = chartRef.current;
        const series = seriesRef.current;
        if (!chart || !series || !activeTool) return;

        const handler = (param) => {
            if (!param.point || !param.time) return;

            if (activeTool === 'hline') {
                // Get price at click y-position
                const coordinate = param.point.y;
                const price = series.coordinateToPrice(coordinate);
                if (price == null || isNaN(price)) return;

                const priceLine = series.createPriceLine({
                    price,
                    color: '#6366F1',
                    lineWidth: 1,
                    lineStyle: 2,
                    axisLabelVisible: true,
                    title: '',
                });
                drawingsRef.current.push(priceLine);
                setHLines((prev) => [...prev, { price, ref: priceLine }]);
            }
        };

        chart.subscribeClick(handler);
        return () => { try { chart.unsubscribeClick(handler); } catch { /* ok */ } };
    }, [activeTool]);

    // ── Clear drawings helper ─────────────────────────────────────────────────
    const clearDrawings = useCallback(() => {
        const series = seriesRef.current;
        if (!series) return;
        drawingsRef.current.forEach((pl) => {
            try { series.removePriceLine(pl); } catch { /* ok */ }
        });
        drawingsRef.current = [];
        setHLines([]);
        setTrendPoints([]);
    }, []);

    const trend = trendData?.overall ? TREND_STYLE[trendData.overall] || TREND_STYLE.NEUTRAL : null;
    const confidence = trendData?.confidence ?? 0;

    // ZeroLoss badge config
    function getZeroLossBadge(zl) {
        if (!zl) return null;
        const dir = zl.direction;
        let color, icon, label;
        if (dir === 'BULLISH') {
            color = 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400';
            icon = <HiTrendingUp className="w-3.5 h-3.5" />;
            label = 'BULLISH';
        } else if (dir === 'BEARISH') {
            color = 'bg-red-500/15 border-red-500/25 text-red-400';
            icon = <HiTrendingDown className="w-3.5 h-3.5" />;
            label = 'BEARISH';
        } else {
            color = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            icon = <HiMinusCircle className="w-3.5 h-3.5" />;
            label = 'NEUTRAL';
        }
        return (
            <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold', color, 'backdrop-blur-md shadow-lg')}
                style={{ marginTop: 4 }}
            >
                {icon}
                <span>ZeroLoss</span>
                <span>{label}</span>
                {typeof zl.score === 'number' && zl.score > 0 && (
                    <span className="opacity-60 font-medium ml-0.5">{Math.round(zl.score)}%</span>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-edge/5 bg-surface-900/30 flex-shrink-0" ref={menuRef}>
                {/* Timeframes — scrollable independently so dropdowns aren't clipped */}
                {onPeriodChange && (
                    <div className="overflow-x-auto no-scrollbar flex-shrink min-w-0">
                        <TimeframeBar period={period} onPeriodChange={onPeriodChange} />
                    </div>
                )}

                <div className="w-px h-4 bg-edge/10 flex-shrink-0" />

                {/* Indicators button */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => { setShowIndicatorMenu((v) => !v); setShowToolsMenu(false); }}
                        className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold transition-colors',
                            activeIndicators.size > 0
                                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-surface-800/60'
                        )}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 16l4-8 4 5 5-9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Indicators
                        {activeIndicators.size > 0 && (
                            <span className="ml-0.5 w-4 h-4 rounded-full bg-primary-500/30 text-[10px] flex items-center justify-center">
                                {activeIndicators.size}
                            </span>
                        )}
                    </button>
                    {showIndicatorMenu && (
                        <IndicatorMenu
                            active={activeIndicators}
                            onToggle={toggleIndicator}
                            onClose={() => setShowIndicatorMenu(false)}
                        />
                    )}
                </div>

                {/* Tools button */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => { setShowToolsMenu((v) => !v); setShowIndicatorMenu(false); }}
                        className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold transition-colors',
                            activeTool
                                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-surface-800/60'
                        )}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 17l10-10M11.7 7.3l4-4a1.4 1.4 0 0 1 2 2l-4 4M15.7 11.3l4 4a1.4 1.4 0 0 1-2 2l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18 22H4a2 2 0 0 1-2-2V4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Tools
                    </button>
                    {showToolsMenu && (
                        <ToolsMenu
                            activeTool={activeTool}
                            onSelect={setActiveTool}
                            onClose={() => setShowToolsMenu(false)}
                        />
                    )}
                </div>

                {/* Clear drawings */}
                {hLines.length > 0 && (
                    <button
                        onClick={clearDrawings}
                        className="px-2 py-1 rounded text-[11px] font-semibold text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                        Clear drawings
                    </button>
                )}

                {/* Active indicator pills */}
                <div className="flex-1 min-w-0 flex justify-end">
                    <ActivePills active={activeIndicators} onRemove={toggleIndicator} />
                </div>
            </div>

            {/* ── Chart canvas area ────────────────────────────────────── */}
            <div className="flex-1 relative min-h-0">
                {isLoading || candles.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Skeleton variant="chart" className="absolute inset-0 rounded-none" />
                        {!isLoading && candles.length === 0 && (
                            <div className="relative z-10 text-gray-600 text-sm">No chart data available</div>
                        )}
                    </div>
                ) : null}

                {/* Trend overlay badges — top-right */}
                {(candles.length > 0 && !isLoading) && (
                    <div className="absolute top-3 right-3 z-10 pointer-events-none select-none flex flex-col items-end gap-1">
                        {trend && (
                            <div className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide backdrop-blur-md shadow-lg',
                                trend.badge, trend.glow
                            )}>
                                <span className="text-sm leading-none">{trend.icon}</span>
                                <span>Multi-Strategy</span>
                                <span>{trend.label}</span>
                                {confidence > 0 && (
                                    <span className="opacity-60 font-medium ml-0.5">{Math.round(confidence)}%</span>
                                )}
                            </div>
                        )}
                        {getZeroLossBadge(zeroLossTrend)}
                    </div>
                )}

                {/* Active tool cursor hint */}
                {activeTool && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800/90 border border-edge/10 text-xs text-gray-400 backdrop-blur-sm shadow-lg">
                            {activeTool === 'hline' && 'Click on chart to place horizontal line'}
                            {activeTool === 'trendline' && 'Click two points to draw trend line'}
                            {activeTool === 'crosshair' && 'Crosshair mode active'}
                            {activeTool === 'measure' && 'Click two points to measure'}
                            <button
                                onClick={() => setActiveTool(null)}
                                className="ml-2 text-gray-600 hover:text-gray-300 pointer-events-auto"
                            >
                                ESC
                            </button>
                        </div>
                    </div>
                )}

                {/* Chart container */}
                <div
                    ref={containerRef}
                    className={cn(
                        'w-full h-full',
                        activeTool === 'hline' && 'cursor-crosshair',
                        activeTool === 'trendline' && 'cursor-crosshair',
                        activeTool === 'measure' && 'cursor-crosshair',
                    )}
                    style={{ visibility: candles.length > 0 && !isLoading ? 'visible' : 'hidden' }}
                />
            </div>
        </div>
    );
}, (prev, next) =>
    prev.candles === next.candles &&
    prev.isLoading === next.isLoading &&
    prev.period === next.period &&
    prev.trendData?.overall === next.trendData?.overall &&
    prev.trendData?.confidence === next.trendData?.confidence
);

export default TradingChart;
