// Re-export shared types
export type {
  ConnectionStatus,
  PriceUpdate,
  HourlyAverage,
  InitialData,
  CryptoSymbol,
} from '@able-crypto/shared';

export { CRYPTO_SYMBOLS } from '@able-crypto/shared';

// Frontend-specific types
export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface CryptoData {
  pair: string;
  currentPrice: number;
  lastUpdate: string;
  lastUpdateTimestamp: number;
  hourlyAverage: number;
  priceChange: number;
  chartData: ChartDataPoint[];
}

