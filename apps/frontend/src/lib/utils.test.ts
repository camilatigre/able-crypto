import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatTime,
  formatRelativeTime,
  symbolToPair,
  calculatePercentageChange,
} from './utils';

describe('formatPrice', () => {
  it('should format price with default 2 decimals', () => {
    expect(formatPrice(1234.56)).toBe('1,234.56');
    expect(formatPrice(1234.5)).toBe('1,234.50');
  });

  it('should format price with custom decimals', () => {
    expect(formatPrice(0.05432, 4)).toBe('0.0543');
    expect(formatPrice(0.05, 4)).toBe('0.0500');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(1234567.89)).toBe('1,234,567.89');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('0.00');
  });
});

describe('formatTime', () => {
  it('should format timestamp to time string', () => {
    const timestamp = new Date('2025-11-11T10:30:45').getTime();
    const result = formatTime(timestamp);
    
    // Result depends on locale, just check format
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });
});

describe('formatRelativeTime', () => {
  it('should show seconds for recent times', () => {
    const now = Date.now();
    const fiveSecondsAgo = now - 5000;
    
    expect(formatRelativeTime(fiveSecondsAgo)).toBe('5 seconds ago');
  });

  it('should show singular second', () => {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    expect(formatRelativeTime(oneSecondAgo)).toBe('1 second ago');
  });

  it('should show minutes for older times', () => {
    const now = Date.now();
    const twoMinutesAgo = now - 120000;
    
    expect(formatRelativeTime(twoMinutesAgo)).toBe('2 minutes ago');
  });

  it('should show singular minute', () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('should show hours for very old times', () => {
    const now = Date.now();
    const threeHoursAgo = now - 10800000;
    
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('should show singular hour', () => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });
});

describe('symbolToPair', () => {
  it('should convert BINANCE:ETHUSDC to ETH/USDC', () => {
    expect(symbolToPair('BINANCE:ETHUSDC')).toBe('ETH/USDC');
  });

  it('should convert BINANCE:ETHUSDT to ETH/USDT', () => {
    expect(symbolToPair('BINANCE:ETHUSDT')).toBe('ETH/USDT');
  });

  it('should convert BINANCE:ETHBTC to ETH/BTC', () => {
    expect(symbolToPair('BINANCE:ETHBTC')).toBe('ETH/BTC');
  });

  it('should return original if no match', () => {
    expect(symbolToPair('BINANCE:UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('calculatePercentageChange', () => {
  it('should calculate positive change correctly', () => {
    expect(calculatePercentageChange(110, 100)).toBe(10);
  });

  it('should calculate negative change correctly', () => {
    expect(calculatePercentageChange(90, 100)).toBe(-10);
  });

  it('should return 0 when values are equal', () => {
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it('should return 0 when average is 0', () => {
    expect(calculatePercentageChange(100, 0)).toBe(0);
  });

  it('should handle decimal values', () => {
    expect(calculatePercentageChange(1855.5, 1850)).toBeCloseTo(0.297, 2);
  });

  it('should handle small values (BTC)', () => {
    expect(calculatePercentageChange(0.054, 0.055)).toBeCloseTo(-1.818, 2);
  });
});

