import { useEffect, useRef, memo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import { CHART_PERIODS } from '../../utils/constants';

/**
 * TradingChart — wraps lightweight-charts (TradingView library).
 *
 * - Timeframe selector bar
 * - ResizeObserver for responsive container
 * - Chart instance updates data directly (bypasses React state for perf)
 * - Full teardown only on theme change (candle updates use series.setData)
 * - Loading skeleton while data is empty
 *
 * @param {{
 *   candles: Array,
 *   period: string,
 *   onPeriodChange: (p: string) => void,
 *   isLoading: boolean,
 *   symbol: string,
 * }} props
 */
const TradingChart = memo(function TradingChart({
    candles = [],
    period = '3M',
    onPeriodChange,
    isLoading = false,
    symbol = '',
}) {
    const { theme } = useTheme();
    const containerRef = useRef(null);
    const chartRef = useRef(null);   // lightweight-charts Chart instance
    const seriesRef = useRef(null);   // CandlestickSeries instance
    const roRef = useRef(null);   // ResizeObserver

    // ── Instantiate / destroy chart when theme changes ─────────────────────────
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

            // ResizeObserver for responsive sizing
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
            }
        };
    }, [theme]); // Only rebuild on theme change

    // ── Update candle data without rebuilding chart ───────────────────────────
    useEffect(() => {
        if (!seriesRef.current || candles.length === 0) return;
        seriesRef.current.setData(candles);
        chartRef.current?.timeScale().fitContent();
    }, [candles]);

    return (
        <div className="flex flex-col h-full">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-edge/5 bg-surface-900/40">
                {Object.entries(CHART_PERIODS).map(([key, { label }]) => (
                    <button
                        key={key}
                        onClick={() => onPeriodChange?.(key)}
                        className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded transition-all duration-150',
                            period === key
                                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        )}
                    >
                        {label}
                    </button>
                ))}
                <div className="ml-auto text-xs text-gray-600 font-mono pr-1">{symbol?.replace('.NS', '')}</div>
            </div>

            {/* Chart area */}
            <div className="flex-1 relative">
                {isLoading || candles.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Skeleton variant="chart" className="absolute inset-0 rounded-none" />
                        {!isLoading && candles.length === 0 && (
                            <div className="relative z-10 text-gray-600 text-sm">No chart data available</div>
                        )}
                    </div>
                ) : null}
                {/* Chart mounts here via ref */}
                <div
                    ref={containerRef}
                    className="w-full h-full"
                    style={{ visibility: candles.length > 0 && !isLoading ? 'visible' : 'hidden' }}
                />
            </div>
        </div>
    );
}, (prev, next) =>
    prev.candles === next.candles &&
    prev.period === next.period &&
    prev.symbol === next.symbol &&
    prev.isLoading === next.isLoading
);

export default TradingChart;
