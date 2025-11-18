import { Injectable } from '@nestjs/common';
import { PriceData } from './buffer-manager.service';

/**
 * RateCalculator
 *
 * Pure business logic for rate calculations.
 * Contains no external dependencies or side effects.
 */
@Injectable()
export class RateCalculator {
  /**
   * Calculate average price from price data array
   */
  calculateAverage(prices: PriceData[]): number | null {
    if (!prices || prices.length === 0) {
      return null;
    }

    const sum = prices.reduce((acc, p) => acc + p.price, 0);
    return sum / prices.length;
  }

  /**
   * Round date to the start of the hour (minutes, seconds, ms = 0)
   */
  roundToHour(date: Date): Date {
    const rounded = new Date(date);
    rounded.setMinutes(0, 0, 0);
    return rounded;
  }

  /**
   * Calculate date N days ago
   */
  getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}

