import { create } from 'zustand';
import api from '../services/api';

/**
 * Watchlist store — centralises watchlist CRUD + price polling.
 * Replaces scattered inline api calls in TradingTerminalPage and Watchlist component.
 */
export const useWatchlistStore = create((set, get) => ({
    /** @type {string|null} Active watchlist ID */
    watchlistId: null,

    /** @type {Array<{ id: string, symbol: string }>} Watchlist items */
    items: [],

    /** @type {Record<string, object>} symbol → latest quote */
    prices: {},

    /** @type {boolean} */
    isLoading: false,

    // ─── Actions ──────────────────────────────────────────────────────────────

    /** Load the first watchlist (or create one if none exist). */
    loadWatchlist: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/watchlist');
            const wls = res.data.watchlists || [];

            if (wls.length > 0) {
                set({ watchlistId: wls[0].id, items: wls[0].items || [] });
            } else {
                // Create an empty watchlist — user adds symbols manually
                const create = await api.post('/watchlist', { name: 'My Watchlist' });
                set({ watchlistId: create.data.id, items: [] });
            }
        } catch { /* ignore */ } finally {
            set({ isLoading: false });
        }
    },

    /** Add a symbol to the watchlist. */
    addItem: async (symbol) => {
        const { watchlistId } = get();
        if (!watchlistId) return;
        try {
            const res = await api.post(`/watchlist/${watchlistId}/items`, { symbol });
            set((s) => ({ items: [...s.items, res.data] }));
        } catch { /* ignore */ }
    },

    /** Remove a symbol from the watchlist. */
    removeItem: async (itemId) => {
        const { watchlistId } = get();
        if (!watchlistId) return;
        try {
            await api.delete(`/watchlist/${watchlistId}/items/${itemId}`);
            set((s) => ({ items: s.items.filter((i) => i.id !== itemId) }));
        } catch { /* ignore */ }
    },

    /** Fetch batch prices for all watchlist symbols. */
    fetchPrices: async () => {
        const { items } = get();
        if (items.length === 0) return;
        const symbols = items.map((w) => w.symbol).join(',');
        try {
            const res = await api.get(`/market/batch?symbols=${symbols}`);
            set({ prices: res.data.quotes || {} });
        } catch { /* ignore */ }
    },

    /** Update prices map directly (e.g. from WS). */
    updatePrices: (quotesMap) =>
        set((s) => ({ prices: { ...s.prices, ...quotesMap } })),
}));
