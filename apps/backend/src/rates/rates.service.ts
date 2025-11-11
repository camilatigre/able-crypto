import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { HourlyRate } from './rate.entity';

interface PriceData {
  price: number;
  timestamp: number;
}

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);
  private priceBuffer: Map<string, PriceData[]> = new Map();
  private gateway: any = null; // Will be set by setGateway to avoid circular dependency

  constructor(
    @InjectRepository(HourlyRate)
    private readonly ratesRepository: Repository<HourlyRate>,
  ) {}

  /**
   * Set gateway reference (called from FinnhubModule)
   */
  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  /**
   * Store incoming price data in memory buffer
   * Calculates and broadcasts initial average after first 10 trades
   */
  addPrice(symbol: string, price: number, timestamp: number) {
    if (!this.priceBuffer.has(symbol)) {
      this.priceBuffer.set(symbol, []);
    }
    const buffer = this.priceBuffer.get(symbol)!;
    buffer.push({ price, timestamp });

    // Calculate and broadcast initial average after 10 trades
    if (buffer.length === 10) {
      this.calculateInitialAverage(symbol);
    }
  }

  /**
   * Calculate initial average from first trades (for immediate UX feedback)
   */
  private calculateInitialAverage(symbol: string) {
    const prices = this.priceBuffer.get(symbol);
    if (!prices || prices.length === 0) return;

    const sum = prices.reduce((acc, p) => acc + p.price, 0);
    const average = sum / prices.length;

    this.logger.log(
      `Initial average for ${symbol}: ${average.toFixed(8)} (${prices.length} samples)`,
    );

    // Broadcast to frontend immediately
    if (this.gateway) {
      this.gateway.broadcastInitialAverage(symbol, average);
    }
  }

  /**
   * Calculate and persist hourly averages
   * Runs every hour at minute 0
   */
  @Cron('0 * * * *')
  async calculateHourlyAverages() {
    this.logger.log('Calculating hourly averages...');
    const successfulSymbols: string[] = [];

    for (const [symbol, prices] of this.priceBuffer.entries()) {
      if (prices.length === 0) continue;

      const sum = prices.reduce((acc, p) => acc + p.price, 0);
      const average = sum / prices.length;
      const hour = new Date();
      hour.setMinutes(0, 0, 0); // Round to the hour

      try {
        await this.ratesRepository.save({
          symbol,
          averagePrice: average,
          hour,
        });

        successfulSymbols.push(symbol);
        this.logger.log(
          `Saved hourly average for ${symbol}: ${average.toFixed(8)} (${prices.length} samples)`,
        );

        // Broadcast hourly average to frontend clients
        if (this.gateway) {
          await this.gateway.broadcastHourlyAverage(symbol);
        }
      } catch (error) {
        this.logger.error(`Failed to save hourly average for ${symbol}:`, error.message);
      }
    }

    // Clear buffer only for successfully saved symbols
    successfulSymbols.forEach((symbol) => this.priceBuffer.delete(symbol));
  }

  /**
   * Get recent hourly averages for a symbol
   */
  async getRecentAverages(symbol: string, hours: number = 24): Promise<HourlyRate[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.ratesRepository.find({
      where: { symbol },
      order: { hour: 'DESC' },
      take: hours,
    });
  }

  /**
   * Cleanup old data (older than 7 days)
   * Runs daily at midnight
   */
  @Cron('0 0 * * *')
  async cleanupOldData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const result = await this.ratesRepository.delete({
        hour: LessThan(sevenDaysAgo),
      });

      this.logger.log(`Cleaned up old data: ${result.affected} records deleted`);
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error.message);
    }
  }
}

