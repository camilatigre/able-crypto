import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HourlyRate } from './rate.entity';
import { RatesRepository } from './rates.repository';
import { BufferManager } from './buffer-manager.service';
import { RateCalculator } from './rate-calculator.service';

/**
 * RatesService
 *
 * Orchestrates rate processing workflow:
 * - Coordinates buffer management, calculation, and persistence
 * - Schedules hourly average calculations
 * - Manages data cleanup
 */
@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);
  private gateway: any = null;

  constructor(
    private readonly repository: RatesRepository,
    private readonly bufferManager: BufferManager,
    private readonly calculator: RateCalculator,
  ) {}

  /**
   * Set gateway reference for broadcasting
   */
  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  /**
   * Add price to buffer and schedule initial average if needed
   */
  addPrice(symbol: string, price: number, timestamp: number) {
    const isFirstTrade = this.bufferManager.addPrice(symbol, price, timestamp);

    if (isFirstTrade) {
      this.bufferManager.scheduleInitialAverage(symbol, () => {
        this.broadcastCurrentAverage(symbol);
      });
    }
  }

  /**
   * Broadcast current average from buffer
   */
  private broadcastCurrentAverage(symbol: string) {
    const average = this.bufferManager.getAverage(symbol);
    if (average === null) return;

    const prices = this.bufferManager.getPrices(symbol);
    this.logger.log(
      `Broadcasting average for ${symbol}: ${average.toFixed(8)} (${prices?.length || 0} samples)`,
    );

    if (this.gateway) {
      this.gateway.broadcastInitialAverage(symbol, average);
    }
  }

  /**
   * Get current average from buffer
   */
  getCurrentAverage(symbol: string): number | null {
    return this.bufferManager.getAverage(symbol);
  }

  /**
   * Calculate and persist hourly averages (runs every hour)
   */
  @Cron('0 * * * *')
  async calculateHourlyAverages() {
    this.logger.log('Calculating hourly averages...');
    const successfulSymbols: string[] = [];

    for (const symbol of this.bufferManager.getAllSymbols()) {
      const prices = this.bufferManager.getPrices(symbol);
      if (!prices || prices.length === 0) continue;

      const average = this.calculator.calculateAverage(prices);
      if (average === null) continue;

      const hour = this.calculator.roundToHour(new Date());

      try {
        await this.repository.save({
          symbol,
          averagePrice: average,
          hour,
        });

        successfulSymbols.push(symbol);
        this.logger.log(
          `Saved hourly average for ${symbol}: ${average.toFixed(8)} (${prices.length} samples)`,
        );

        if (this.gateway) {
          await this.gateway.broadcastHourlyAverage(symbol);
        }
      } catch (error) {
        this.logger.error(`Failed to save hourly average for ${symbol}:`, error.message);
      }
    }

    successfulSymbols.forEach((symbol) => this.bufferManager.clear(symbol));
  }

  /**
   * Get recent hourly averages for a symbol
   */
  async getRecentAverages(symbol: string, hours: number = 24): Promise<HourlyRate[]> {
    return this.repository.findRecent(symbol, hours);
  }

  /**
   * Cleanup old data (runs daily at midnight)
   */
  @Cron('0 0 * * *')
  async cleanupOldData() {
    const sevenDaysAgo = this.calculator.getDaysAgo(7);

    try {
      const deletedCount = await this.repository.deleteOlderThan(sevenDaysAgo);
      this.logger.log(`Cleaned up old data: ${deletedCount} records deleted`);
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error.message);
    }
  }
}

