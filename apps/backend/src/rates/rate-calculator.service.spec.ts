import { Test, TestingModule } from '@nestjs/testing';
import { RateCalculator } from './rate-calculator.service';
import { PriceData } from './buffer-manager.service';

describe('RateCalculator', () => {
  let service: RateCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateCalculator],
    }).compile();

    service = module.get<RateCalculator>(RateCalculator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAverage', () => {
    it('should return null for empty array', () => {
      expect(service.calculateAverage([])).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(service.calculateAverage(undefined as any)).toBeNull();
    });

    it('should return null for null', () => {
      expect(service.calculateAverage(null as any)).toBeNull();
    });

    it('should calculate average for single price', () => {
      const prices: PriceData[] = [{ price: 1850.5, timestamp: Date.now() }];
      expect(service.calculateAverage(prices)).toBe(1850.5);
    });

    it('should calculate average for multiple prices', () => {
      const prices: PriceData[] = [
        { price: 1850, timestamp: Date.now() },
        { price: 1860, timestamp: Date.now() },
        { price: 1840, timestamp: Date.now() },
      ];
      expect(service.calculateAverage(prices)).toBe(1850);
    });

    it('should handle decimal precision correctly', () => {
      const prices: PriceData[] = [
        { price: 1850.12345, timestamp: Date.now() },
        { price: 1860.67890, timestamp: Date.now() },
      ];
      const avg = service.calculateAverage(prices);
      expect(avg).toBeCloseTo(1855.401175, 6);
    });

    it('should handle large numbers', () => {
      const prices: PriceData[] = [
        { price: 1000000, timestamp: Date.now() },
        { price: 2000000, timestamp: Date.now() },
        { price: 3000000, timestamp: Date.now() },
      ];
      expect(service.calculateAverage(prices)).toBe(2000000);
    });

    it('should handle very small numbers', () => {
      const prices: PriceData[] = [
        { price: 0.00001, timestamp: Date.now() },
        { price: 0.00002, timestamp: Date.now() },
        { price: 0.00003, timestamp: Date.now() },
      ];
      expect(service.calculateAverage(prices)).toBeCloseTo(0.00002, 5);
    });
  });

  describe('roundToHour', () => {
    it('should round date to start of hour', () => {
      const date = new Date('2024-01-15T14:35:42.123Z');
      const rounded = service.roundToHour(date);

      expect(rounded.getMinutes()).toBe(0);
      expect(rounded.getSeconds()).toBe(0);
      expect(rounded.getMilliseconds()).toBe(0);
      expect(rounded.getHours()).toBe(date.getHours());
    });

    it('should not modify date if already at start of hour', () => {
      const date = new Date('2024-01-15T14:00:00.000Z');
      const rounded = service.roundToHour(date);

      expect(rounded.getTime()).toBe(date.getTime());
    });

    it('should not modify original date object', () => {
      const date = new Date('2024-01-15T14:35:42.123Z');
      const originalTime = date.getTime();

      service.roundToHour(date);

      expect(date.getTime()).toBe(originalTime);
    });

    it('should handle midnight correctly', () => {
      const date = new Date('2024-01-15T00:35:42.123Z');
      const rounded = service.roundToHour(date);

      expect(rounded.getUTCHours()).toBe(0);
      expect(rounded.getMinutes()).toBe(0);
    });

    it('should handle end of day correctly', () => {
      const date = new Date('2024-01-15T23:59:59.999Z');
      const rounded = service.roundToHour(date);

      expect(rounded.getUTCHours()).toBe(23);
      expect(rounded.getMinutes()).toBe(0);
      expect(rounded.getSeconds()).toBe(0);
      expect(rounded.getMilliseconds()).toBe(0);
    });
  });

  describe('getDaysAgo', () => {
    it('should calculate date 7 days ago', () => {
      const result = service.getDaysAgo(7);
      const now = new Date();
      const expected = new Date(now);
      expected.setDate(expected.getDate() - 7);

      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getFullYear()).toBe(expected.getFullYear());
    });

    it('should handle 0 days', () => {
      const result = service.getDaysAgo(0);
      const now = new Date();

      expect(result.getDate()).toBe(now.getDate());
    });

    it('should handle 1 day', () => {
      const result = service.getDaysAgo(1);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(result.getDate()).toBe(yesterday.getDate());
    });

    it('should handle month boundaries', () => {
      const result = service.getDaysAgo(35);
      const now = new Date();
      
      expect(result.getTime()).toBeLessThan(now.getTime());
      
      const daysDiff = Math.floor(
        (now.getTime() - result.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(35);
    });

    it('should handle year boundaries', () => {
      const result = service.getDaysAgo(400);
      const now = new Date();
      
      expect(result.getTime()).toBeLessThan(now.getTime());
    });
  });
});

