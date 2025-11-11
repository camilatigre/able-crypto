/**
 * Represents a cryptocurrency trading pair with real-time price data
 */
export interface CryptoPair {
  symbol: string;
  price: number;
  timestamp: number;
}

/**
 * Represents an hourly average for a cryptocurrency pair
 */
export interface HourlyAverage {
  symbol: string;
  averagePrice: number;
  hour: Date;
}

/**
 * WebSocket connection status
 */
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * Real-time rate update event
 */
export interface RateUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

/**
 * Hourly average update event
 */
export interface HourlyAverageUpdate {
  symbol: string;
  averagePrice: number;
  hour: string;
}

/**
 * Supported cryptocurrency pairs
 */
export const CRYPTO_PAIRS = {
  ETH_USDC: 'BINANCE:ETHUSDC',
  ETH_USDT: 'BINANCE:ETHUSDT',
  ETH_BTC: 'BINANCE:ETHBTC',
} as const;

/**
 * Display names for crypto pairs
 */
export const CRYPTO_PAIR_LABELS: Record<string, string> = {
  'BINANCE:ETHUSDC': 'ETH/USDC',
  'BINANCE:ETHUSDT': 'ETH/USDT',
  'BINANCE:ETHBTC': 'ETH/BTC',
};

