import { memo } from 'react';
import { cn } from '../utils/cn';
import { formatPrice } from '../utils/formatters';
import { ORDER_STATUS_CLASS } from '../utils/constants';
import { PanelContainer } from '.';

/**
 * OrderHistoryPanel — shows recent orders.
 * Extracted from TradingTerminalPage BottomTabs → "orders" tab.
 */
function OrderHistoryPanel({ orders = [], className }) {
    return (
        <PanelContainer title="Orders" noPadding className={className}
            actions={<span className="text-[10px] text-gray-600 font-mono">{orders.length}</span>}
        >
            {orders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[600px]">
                        <thead>
                            <tr className="text-gray-500 uppercase">
                                <th className="text-left px-3 pb-2 pt-2 font-medium">Symbol</th>
                                <th className="text-left px-3 pb-2 pt-2 font-medium">Side</th>
                                <th className="text-left px-3 pb-2 pt-2 font-medium">Type</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">Qty</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">Price</th>
                                <th className="text-right px-3 pb-2 pt-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o, i) => (
                                <tr key={o.id || i} className="border-t border-edge/[0.02]">
                                    <td className="px-3 py-1.5 font-semibold text-heading">{o.symbol?.replace('.NS', '')}</td>
                                    <td className={cn('px-3 py-1.5 font-semibold', o.side === 'BUY' ? 'text-bull' : 'text-bear')}>{o.side}</td>
                                    <td className="px-3 py-1.5 text-gray-400">{o.order_type}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-gray-300">{o.quantity}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-heading">
                                        {formatPrice(o.filled_price ?? o.price ?? null)}
                                    </td>
                                    <td className="px-3 py-1.5 text-right">
                                        <span className={cn('text-[11px] px-1.5 py-0.5 rounded font-medium',
                                            ORDER_STATUS_CLASS[o.status] || ORDER_STATUS_CLASS.PENDING
                                        )}>
                                            {o.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-6 text-gray-600 text-xs">No orders yet.</div>
            )}
        </PanelContainer>
    );
}

export default memo(OrderHistoryPanel);
