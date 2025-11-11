// WebSocket Events Data Types
export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface HourlyAverage {
  symbol: string;
  averagePrice: number;
  hour: string;
}

export interface InitialData {
  symbol: string;
  averages: HourlyAverage[];
}

// Connection Status
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'
  | 'slow';

// Supported Symbols
export const CRYPTO_SYMBOLS = {
  ETH_USDC: 'BINANCE:ETHUSDC',
  ETH_USDT: 'BINANCE:ETHUSDT',
  ETH_BTC: 'BINANCE:ETHBTC',
} as const;

export type CryptoSymbol = typeof CRYPTO_SYMBOLS[keyof typeof CRYPTO_SYMBOLS];

