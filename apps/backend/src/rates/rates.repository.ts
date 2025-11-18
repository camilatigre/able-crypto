import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { HourlyRate } from './rate.entity';

/**
 * RatesRepository
 *
 * Abstracts TypeORM operations for HourlyRate entity.
 * Provides a clean interface for data persistence layer.
 */
@Injectable()
export class RatesRepository {
  constructor(
    @InjectRepository(HourlyRate)
    private readonly repository: Repository<HourlyRate>,
  ) {}

  /**
   * Save hourly rate record
   */
  async save(data: Partial<HourlyRate>): Promise<HourlyRate> {
    return this.repository.save(data);
  }

  /**
   * Find recent hourly averages for a symbol
   */
  async findRecent(symbol: string, hours: number): Promise<HourlyRate[]> {
    return this.repository.find({
      where: { symbol },
      order: { hour: 'DESC' },
      take: hours,
    });
  }

  /**
   * Delete records older than specified date
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.repository.delete({
      hour: LessThan(date),
    });
    return result.affected || 0;
  }
}

