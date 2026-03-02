import { useState, memo } from 'react';
import { cn } from '../utils/cn';
import { formatPrice, formatPercent, pnlColorClass } from '../utils/formatters';
import { ORDER_STATUS_CLASS } from '../utils/constants';
import { PanelContainer } from '.';

/**
 * Positions Panel — shows open positions in a table.
 * Extracted from TradingTerminalPage BottomTabs → "positions" tab.
 */
function PositionsPanel({ holdings = [], className }) {
    return (
        <PanelContainer title="Positions" noPadding className={className}
            actions={<span className="text-[10px] text-gray-600 font-price tabular-nums">{holdings.length}</span>}
        >
            {holdings.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#1e2128]">
                                <th className="text-left px-3 pb-2 pt-2 text-[11px] font-medium tracking-wider uppercase text-slate-500">Symbol</th>
                                <th className="text-right px-3 pb-2 pt-2 text-[11px] font-medium tracking-wider uppercase text-slate-500">Qty</th>
                                <th className="text-right px-3 pb-2 pt-2 text-[11px] font-medium tracking-wider uppercase text-slate-500">Avg</th>
                                <th className="text-right px-3 pb-2 pt-2 text-[11px] font-medium tracking-wider uppercase text-slate-500">LTP</th>
                                <th className="text-right px-3 pb-2 pt-2 text-[11px] font-medium tracking-wider uppercase text-slate-500">P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.map((h, i) => {
                                const pnl = h.pnl ?? 0;
                                const pnlPct = h.pnl_percent ?? 0;
                                return (
                                    <tr key={h.symbol || i} className="border-b border-[#1a1d24] hover:bg-[#1a1d24] transition-colors">
                                        <td className="py-2.5 px-3 font-medium text-slate-100">{h.symbol?.replace('.NS', '')}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{h.quantity}</td>
                                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatPrice(h.avg_price)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-100">{formatPrice(h.current_price)}</td>
                                        <td className={cn('py-2.5 px-3 text-right font-mono font-medium', pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                            {pnl >= 0 ? '+' : ''}₹{formatPrice(pnl)}{' '}
                                            ({formatPercent(pnlPct)})
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-6 text-gray-600 text-xs">
                    No open positions. Place a trade to get started.
                </div>
            )}
        </PanelContainer>
    );
}

export default memo(PositionsPanel);
