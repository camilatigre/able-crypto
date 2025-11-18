import { Injectable, Logger } from '@nestjs/common';

export interface PriceData {
  price: number;
  timestamp: number;
}

/**
 * BufferManager
 *
 * Manages in-memory price buffers for calculating hourly averages.
 * Handles price accumulation and timer management for initial averages.
 */
@Injectable()
export class BufferManager {
  private readonly logger = new Logger(BufferManager.name);
  private priceBuffer: Map<string, PriceData[]> = new Map();
  private initialAverageSent: Set<string> = new Set();
  private initialTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add price to buffer for a symbol
   * Returns true if this is the first price for the symbol
   */
  addPrice(symbol: string, price: number, timestamp: number): boolean {
    const isFirstTrade = !this.priceBuffer.has(symbol);

    if (isFirstTrade) {
      this.priceBuffer.set(symbol, []);
    }

    const buffer = this.priceBuffer.get(symbol)!;
    buffer.push({ price, timestamp });

    return isFirstTrade;
  }

  /**
   * Get all prices for a symbol
   */
  getPrices(symbol: string): PriceData[] | undefined {
    return this.priceBuffer.get(symbol);
  }

  /**
   * Check if buffer has prices for a symbol
   */
  hasPrices(symbol: string): boolean {
    const prices = this.priceBuffer.get(symbol);
    return prices !== undefined && prices.length > 0;
  }

  /**
   * Calculate average from buffer
   */
  getAverage(symbol: string): number | null {
    const prices = this.priceBuffer.get(symbol);
    if (!prices || prices.length === 0) return null;

    const sum = prices.reduce((acc, p) => acc + p.price, 0);
    return sum / prices.length;
  }

  /**
   * Clear buffer for a symbol
   */
  clear(symbol: string): void {
    this.priceBuffer.delete(symbol);
  }

  /**
   * Get all symbols with buffered prices
   */
  getAllSymbols(): string[] {
    return Array.from(this.priceBuffer.keys());
  }

  /**
   * Schedule initial average calculation
   */
  scheduleInitialAverage(
    symbol: string,
    callback: () => void,
    delayMs: number = 2000,
  ): void {
    if (this.initialAverageSent.has(symbol)) {
      return;
    }

    const timer = setTimeout(() => {
      if (!this.initialAverageSent.has(symbol)) {
        callback();
        this.initialAverageSent.add(symbol);
        this.initialTimers.delete(symbol);
      }
    }, delayMs);

    this.initialTimers.set(symbol, timer);
  }

  /**
   * Clear all timers (cleanup on module destroy)
   */
  clearAllTimers(): void {
    for (const timer of this.initialTimers.values()) {
      clearTimeout(timer);
    }
    this.initialTimers.clear();
  }

  /**
   * Check if initial average was already sent
   */
  wasInitialAverageSent(symbol: string): boolean {
    return this.initialAverageSent.has(symbol);
  }
}

