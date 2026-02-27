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
            actions={<span className="text-[10px] text-gray-600 font-mono">{holdings.length}</span>}
        >
            {holdings.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px]">
                        <thead>
                            <tr className="text-gray-500 uppercase">
                                <th className="text-left px-3 pb-2 pt-2 font-medium">Symbol</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">Qty</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">Avg</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">LTP</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.map((h, i) => (
                                <tr key={h.symbol || i} className="border-t border-edge/[0.02]">
                                    <td className="px-3 py-1.5 font-semibold text-heading">{h.symbol?.replace('.NS', '')}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-gray-300">{h.quantity}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-gray-300">{formatPrice(h.avg_price)}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-heading">{formatPrice(h.current_price)}</td>
                                    <td className={cn('px-3 py-1.5 text-right font-mono font-semibold', pnlColorClass(h.pnl ?? 0))}>
                                        {(h.pnl ?? 0) >= 0 ? '+' : ''}₹{formatPrice(h.pnl ?? 0)}{' '}
                                        ({formatPercent(h.pnl_percent ?? 0)})
                                    </td>
                                </tr>
                            ))}
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
