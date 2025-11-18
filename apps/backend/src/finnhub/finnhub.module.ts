import { Module } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';
import { FinnhubGateway } from './finnhub.gateway';
import { WebSocketClient } from './websocket-client.service';
import { RatesModule } from '../rates/rates.module';
import { RatesService } from '../rates/rates.service';

@Module({
  imports: [RatesModule],
  providers: [
    FinnhubService,
    FinnhubGateway,
    WebSocketClient,
    {
      provide: 'GATEWAY_SETUP',
      useFactory: (ratesService: RatesService, gateway: FinnhubGateway) => {
        ratesService.setGateway(gateway);
        return true;
      },
      inject: [RatesService, FinnhubGateway],
    },
  ],
  exports: [FinnhubService, FinnhubGateway],
})
export class FinnhubModule {}

