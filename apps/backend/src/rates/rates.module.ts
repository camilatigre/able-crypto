import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HourlyRate } from './rate.entity';
import { RatesService } from './rates.service';
import { RatesRepository } from './rates.repository';
import { BufferManager } from './buffer-manager.service';
import { RateCalculator } from './rate-calculator.service';

@Module({
  imports: [TypeOrmModule.forFeature([HourlyRate])],
  providers: [
    RatesService,
    RatesRepository,
    BufferManager,
    RateCalculator,
  ],
  exports: [RatesService],
})
export class RatesModule {}

