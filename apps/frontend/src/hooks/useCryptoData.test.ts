import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCryptoData } from './useCryptoData';
import { CRYPTO_SYMBOLS } from '@able-crypto/shared';

describe('useCryptoData', () => {
  it('should initialize with empty crypto data for all symbols', () => {
    const { result } = renderHook(() => useCryptoData());

    expect(result.current.cryptoData.size).toBe(3);
    expect(result.current.cryptoData.has(CRYPTO_SYMBOLS.ETH_USDC)).toBe(true);
    expect(result.current.cryptoData.has(CRYPTO_SYMBOLS.ETH_USDT)).toBe(true);
    expect(result.current.cryptoData.has(CRYPTO_SYMBOLS.ETH_BTC)).toBe(true);
  });

  it('should handle price update', () => {
    const { result } = renderHook(() => useCryptoData());

    act(() => {
      result.current.handlePriceUpdate({
        symbol: CRYPTO_SYMBOLS.ETH_USDC,
        price: 2456.78,
        timestamp: Date.now(),
      });
    });

    const data = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_USDC);
    expect(data?.currentPrice).toBe(2456.78);
    expect(data?.chartData.length).toBe(1);
  });

  it('should update hourly average', () => {
    const { result } = renderHook(() => useCryptoData());

    act(() => {
      result.current.handleHourlyAverage({
        symbol: CRYPTO_SYMBOLS.ETH_USDC,
        averagePrice: 2448.32,
        hour: new Date().toISOString(),
      });
    });

    const data = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_USDC);
    expect(data?.hourlyAverage).toBe(2448.32);
  });

  it('should calculate price change correctly', () => {
    const { result } = renderHook(() => useCryptoData());

    // Set hourly average first
    act(() => {
      result.current.handleHourlyAverage({
        symbol: CRYPTO_SYMBOLS.ETH_USDC,
        averagePrice: 2400,
        hour: new Date().toISOString(),
      });
    });

    // Update price (higher than average)
    act(() => {
      result.current.handlePriceUpdate({
        symbol: CRYPTO_SYMBOLS.ETH_USDC,
        price: 2448,
        timestamp: Date.now(),
      });
    });

    const data = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_USDC);
    expect(data?.priceChange).toBe(2); // (2448 - 2400) / 2400 * 100 = 2%
  });

  it('should limit chart data to 50 points', () => {
    const { result } = renderHook(() => useCryptoData());

    // Add 60 price updates
    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.handlePriceUpdate({
          symbol: CRYPTO_SYMBOLS.ETH_USDC,
          price: 2400 + i,
          timestamp: Date.now() + i * 1000,
        });
      }
    });

    const data = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_USDC);
    expect(data?.chartData.length).toBe(50); // Should be capped at 50
  });

  it('should handle initial data', () => {
    const { result } = renderHook(() => useCryptoData());

    act(() => {
      result.current.handleInitialData({
        symbol: CRYPTO_SYMBOLS.ETH_USDC,
        averages: [
          {
            symbol: CRYPTO_SYMBOLS.ETH_USDC,
            averagePrice: 2450,
            hour: new Date().toISOString(),
          },
        ],
      });
    });

    const data = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_USDC);
    expect(data?.hourlyAverage).toBe(2450);
  });

  it('should handle multiple symbols independently', () => {
    const { result } = renderHook(() => useCryptoData());

    act(() => {
      result.current.handlePriceUpdate({
        symbol: CRYPTO_SYMBOLS.ETH_USDC,
        price: 2456,
        timestamp: Date.now(),
      });

      result.current.handlePriceUpdate({
        symbol: CRYPTO_SYMBOLS.ETH_BTC,
        price: 0.054,
        timestamp: Date.now(),
      });
    });

    const ethUsdc = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_USDC);
    const ethBtc = result.current.getCryptoData(CRYPTO_SYMBOLS.ETH_BTC);

    expect(ethUsdc?.currentPrice).toBe(2456);
    expect(ethBtc?.currentPrice).toBe(0.054);
  });

  it('should return undefined for unknown symbol', () => {
    const { result } = renderHook(() => useCryptoData());

    const data = result.current.getCryptoData('UNKNOWN:SYMBOL');
    expect(data).toBeUndefined();
  });
});

