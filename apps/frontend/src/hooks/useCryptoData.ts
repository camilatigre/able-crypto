import { useState, useCallback } from 'react';
import type { CryptoData, PriceUpdate, HourlyAverage, InitialData, ChartDataPoint } from '../types/crypto';
import { symbolToPair, formatTime, formatRelativeTime, calculatePercentageChange } from '../lib/utils';
import { CRYPTO_SYMBOLS } from '@able-crypto/shared';

const MAX_CHART_POINTS = 50;

interface UseCryptoDataReturn {
  cryptoData: Map<string, CryptoData>;
  handlePriceUpdate: (data: PriceUpdate) => void;
  handleHourlyAverage: (data: HourlyAverage) => void;
  handleInitialData: (data: InitialData) => void;
  getCryptoData: (symbol: string) => CryptoData | undefined;
  isSlow: boolean;
}

const createEmptyCryptoData = (symbol: string): CryptoData => ({
  pair: symbolToPair(symbol),
  currentPrice: 0,
  lastUpdate: '',
  lastUpdateTimestamp: 0,
  hourlyAverage: 0,
  priceChange: 0,
  chartData: [],
});

export const useCryptoData = (): UseCryptoDataReturn => {
  const [cryptoData, setCryptoData] = useState<Map<string, CryptoData>>(
    new Map([
      [CRYPTO_SYMBOLS.ETH_USDC, createEmptyCryptoData(CRYPTO_SYMBOLS.ETH_USDC)],
      [CRYPTO_SYMBOLS.ETH_USDT, createEmptyCryptoData(CRYPTO_SYMBOLS.ETH_USDT)],
      [CRYPTO_SYMBOLS.ETH_BTC, createEmptyCryptoData(CRYPTO_SYMBOLS.ETH_BTC)],
    ]),
  );
  const [isSlow, setIsSlow] = useState(false);

  // Check if connection is slow (no updates for 30+ seconds)
  const checkSlowConnection = useCallback(() => {
    const now = Date.now();
    let hasSlowData = false;

    cryptoData.forEach((data) => {
      if (data.lastUpdateTimestamp > 0) {
        const secondsSinceUpdate = (now - data.lastUpdateTimestamp) / 1000;
        if (secondsSinceUpdate > 30) {
          hasSlowData = true;
        }
      }
    });

    setIsSlow(hasSlowData);
  }, [cryptoData]);

  // Set up interval to check for slow connection
  useState(() => {
    const interval = setInterval(checkSlowConnection, 5000);
    return () => clearInterval(interval);
  });

  const handlePriceUpdate = useCallback((data: PriceUpdate) => {
    setCryptoData((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.symbol) || createEmptyCryptoData(data.symbol);

      // Add to chart data
      const newChartPoint: ChartDataPoint = {
        time: formatTime(data.timestamp),
        price: data.price,
      };

      const updatedChartData = [...existing.chartData, newChartPoint].slice(-MAX_CHART_POINTS);

      // Calculate price change
      const priceChange = existing.hourlyAverage > 0
        ? calculatePercentageChange(data.price, existing.hourlyAverage)
        : 0;

      newMap.set(data.symbol, {
        ...existing,
        currentPrice: data.price,
        lastUpdate: formatRelativeTime(data.timestamp),
        lastUpdateTimestamp: data.timestamp,
        priceChange,
        chartData: updatedChartData,
      });

      return newMap;
    });
  }, []);

  const handleHourlyAverage = useCallback((data: HourlyAverage) => {
    setCryptoData((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.symbol) || createEmptyCryptoData(data.symbol);

      // Calculate new price change with updated hourly average
      const priceChange = existing.currentPrice > 0
        ? calculatePercentageChange(existing.currentPrice, data.averagePrice)
        : 0;

      newMap.set(data.symbol, {
        ...existing,
        hourlyAverage: data.averagePrice,
        priceChange,
      });

      return newMap;
    });
  }, []);

  const handleInitialData = useCallback((data: InitialData) => {
    setCryptoData((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.symbol) || createEmptyCryptoData(data.symbol);

      // Get latest hourly average
      const latestAverage = data.averages[0];

      if (latestAverage) {
        newMap.set(data.symbol, {
          ...existing,
          hourlyAverage: latestAverage.averagePrice,
        });
      }

      return newMap;
    });
  }, []);

  const getCryptoData = useCallback(
    (symbol: string): CryptoData | undefined => {
      return cryptoData.get(symbol);
    },
    [cryptoData],
  );

  return {
    cryptoData,
    handlePriceUpdate,
    handleHourlyAverage,
    handleInitialData,
    getCryptoData,
    isSlow,
  };
};

