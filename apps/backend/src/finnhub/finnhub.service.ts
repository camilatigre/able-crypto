import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { RatesService } from '../rates/rates.service';
import { FinnhubGateway } from './finnhub.gateway';
import { WebSocketClient } from './websocket-client.service';

interface FinnhubTradeRaw {
  s: string;
  p: number;
  t: number;
  v: number;
}

interface FinnhubTrade {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
}

interface FinnhubMessage {
  type: string;
  data?: FinnhubTradeRaw[];
}

/**
 * FinnhubService
 *
 * Manages Finnhub WebSocket integration and trade data processing.
 * Handles subscription management and message parsing.
 */
@Injectable()
export class FinnhubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FinnhubService.name);
  private readonly symbols = ['BINANCE:ETHUSDC', 'BINANCE:ETHUSDT', 'BINANCE:ETHBTC'];

  constructor(
    private readonly configService: ConfigService,
    private readonly ratesService: RatesService,
    private readonly wsClient: WebSocketClient,
    @Inject(forwardRef(() => FinnhubGateway))
    private readonly gateway: FinnhubGateway,
  ) {}

  onModuleInit() {
    this.setupWebSocketHandlers();
    this.connect();
  }

  onModuleDestroy() {
    this.wsClient.disconnect();
  }

  private setupWebSocketHandlers(): void {
    this.wsClient.onOpen(() => this.handleOpen());
    this.wsClient.onMessage((data: WebSocket.Data) => this.handleMessage(data));
    this.wsClient.onError((error: Error) => this.handleError(error));
  }

  private connect(): void {
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');

    if (!apiKey) {
      this.logger.error('FINNHUB_API_KEY is not set');
      return;
    }

    const url = `wss://ws.finnhub.io?token=${apiKey}`;
    this.wsClient.connect(url);
  }

  private handleOpen(): void {
    this.logger.log('Connected to Finnhub, subscribing to symbols...');
    this.symbols.forEach((symbol) => this.subscribe(symbol));
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message: FinnhubMessage = JSON.parse(data.toString());

      if (message.type === 'ping') {
        return;
      }

      if (message.type === 'trade' && message.data) {
        this.processTradeData(message.data);
      }
    } catch (error) {
      this.logger.error('Failed to parse message:', error.message);
    }
  }

  private processTradeData(trades: FinnhubTradeRaw[]): void {
    trades.forEach((tradeRaw) => {
      const trade: FinnhubTrade = {
        symbol: tradeRaw.s,
        price: tradeRaw.p,
        timestamp: tradeRaw.t,
        volume: tradeRaw.v,
      };

      this.logger.debug(
        `Trade: ${trade.symbol} - $${trade.price.toFixed(2)} at ${new Date(trade.timestamp).toISOString()}`,
      );

      this.ratesService.addPrice(trade.symbol, trade.price, trade.timestamp);
      this.gateway.broadcastPriceUpdate(trade.symbol, trade.price, trade.timestamp);
    });
  }

  private handleError(error: Error): void {
    this.logger.error('WebSocket error:', error.message);
  }

  private subscribe(symbol: string): void {
    const message = JSON.stringify({ type: 'subscribe', symbol });
    const success = this.wsClient.send(message);
    
    if (success) {
      this.logger.log(`📊 Subscribed to ${symbol}`);
    }
  }

  getConnectionStatus(): string {
    return this.wsClient.getStatus();
  }
}

