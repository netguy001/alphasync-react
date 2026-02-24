/** API base path (handled by Vite proxy / api.js baseURL) */
export const API_BASE = '/api';

/** LocalStorage keys */
export const LS_TOKEN = 'alphasync_token';
export const LS_REFRESH = 'alphasync_refresh';
export const LS_USER = 'alphasync_user';
export const LS_THEME = 'alphasync_theme';
export const LS_SIDEBAR = 'alphasync_sidebar_collapsed';

/** WebSocket reconnect config */
export const WS_MAX_BACKOFF_MS = 30_000;
export const WS_HEARTBEAT_MS = 30_000;

/** Chart period → { period, interval } mapping (yfinance conventions) */
export const CHART_PERIODS = {
    '1D': { period: '1d', interval: '5m', label: '1D' },
    '1W': { period: '5d', interval: '1h', label: '1W' },
    '1M': { period: '1mo', interval: '1d', label: '1M' },
    '3M': { period: '3mo', interval: '1d', label: '3M' },
    '6M': { period: '6mo', interval: '1d', label: '6M' },
    '1Y': { period: '1y', interval: '1d', label: '1Y' },
    '5Y': { period: '5y', interval: '1d', label: '5Y' },
};

/** Default chart period key */
export const DEFAULT_CHART_PERIOD = '3M';

/** Order sides */
export const ORDER_SIDE = { BUY: 'BUY', SELL: 'SELL' };

/** Order types */
export const ORDER_TYPE = {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
    SL: 'SL',
    SL_M: 'SL-M',
};

/** Product types */
export const PRODUCT_TYPE = {
    CNC: 'CNC',
    MIS: 'MIS',
    NRML: 'NRML',
};

/** Order status badge map */
export const ORDER_STATUS_CLASS = {
    COMPLETE: 'bg-green-500/10 text-green-400 border border-green-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
    OPEN: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

/** Market session state labels */
export const MARKET_STATE_LABEL = {
    open: 'Market Open',
    pre_market: 'Pre-Market',
    closing: 'Closing',
    after_market: 'After Hours',
    weekend: 'Weekend',
    holiday: 'Holiday',
    closed: 'Market Closed',
};

/** Default watchlist symbols to seed a new account */
export const DEFAULT_WATCHLIST_SYMBOLS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
];

/** Sidebar widths */
export const SIDEBAR_EXPANDED_W = 240;
export const SIDEBAR_COLLAPSED_W = 72;
