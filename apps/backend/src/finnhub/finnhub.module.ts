import { Module } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';
import { RatesModule } from '../rates/rates.module';

@Module({
  imports: [RatesModule],
  providers: [FinnhubService],
  exports: [FinnhubService],
})
export class FinnhubModule {}

