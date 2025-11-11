import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HourlyRate } from './rate.entity';
import { RatesService } from './rates.service';

@Module({
  imports: [TypeOrmModule.forFeature([HourlyRate])],
  providers: [RatesService],
  exports: [RatesService],
})
export class RatesModule {}

