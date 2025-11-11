import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { RatesService } from '../rates/rates.service';
import { FinnhubGateway } from './finnhub.gateway';

interface FinnhubTradeRaw {
  s: string; // symbol
  p: number; // price
  t: number; // timestamp
  v: number; // volume
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

@Injectable()
export class FinnhubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FinnhubService.name);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  private readonly symbols = ['BINANCE:ETHUSDC', 'BINANCE:ETHUSDT', 'BINANCE:ETHBTC'];

  constructor(
    private readonly configService: ConfigService,
    private readonly ratesService: RatesService,
    @Inject(forwardRef(() => FinnhubGateway))
    private readonly gateway: FinnhubGateway,
  ) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const apiKey = this.configService.get<string>('FINNHUB_API_KEY');

    if (!apiKey) {
      this.logger.error('FINNHUB_API_KEY is not set');
      this.isConnecting = false;
      return;
    }

    const url = `wss://ws.finnhub.io?token=${apiKey}`;
    this.logger.log(`Connecting to Finnhub WebSocket... (attempt ${this.reconnectAttempts + 1})`);

    try {
      this.ws = new WebSocket(url);

      this.ws!.on('open', () => this.handleOpen());
      this.ws!.on('message', (data: WebSocket.Data) => this.handleMessage(data));
      this.ws!.on('error', (error: Error) => this.handleError(error));
      this.ws!.on('close', () => this.handleClose());
    } catch (error) {
      this.logger.error('Failed to create WebSocket connection:', (error as Error).message);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleOpen() {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.logger.log('✅ Connected to Finnhub WebSocket');

    // Subscribe to all symbols
    this.symbols.forEach((symbol) => {
      this.subscribe(symbol);
    });
  }

  private handleMessage(data: WebSocket.Data) {
    try {
      const message: FinnhubMessage = JSON.parse(data.toString());

      if (message.type === 'ping') {
        // Finnhub sends ping to keep connection alive
        return;
      }

      if (message.type === 'trade' && message.data) {
        message.data.forEach((tradeRaw) => {
          const trade: FinnhubTrade = {
            symbol: tradeRaw.s,
            price: tradeRaw.p,
            timestamp: tradeRaw.t,
            volume: tradeRaw.v,
          };

          this.logger.debug(
            `Trade received: ${trade.symbol} - $${trade.price.toFixed(2)} at ${new Date(trade.timestamp).toISOString()}`,
          );
          
          // Pass to RatesService to add to buffer
          this.ratesService.addPrice(trade.symbol, trade.price, trade.timestamp);
          
          // Broadcast to connected frontend clients (throttled)
          this.gateway.broadcastPriceUpdate(trade.symbol, trade.price, trade.timestamp);
        });
      }
    } catch (error) {
      this.logger.error('Failed to parse message:', error.message);
    }
  }

  private handleError(error: Error) {
    this.logger.error('WebSocket error:', error.message);
  }

  private handleClose() {
    this.logger.warn('WebSocket connection closed');
    this.ws = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`,
      );
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s...
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 64000);
    this.reconnectAttempts++;

    this.logger.log(`Reconnecting in ${delay / 1000}s...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private subscribe(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn(`Cannot subscribe to ${symbol}: WebSocket not connected`);
      return;
    }

    const message = JSON.stringify({ type: 'subscribe', symbol });
    this.ws.send(message);
    this.logger.log(`📊 Subscribed to ${symbol}`);
  }

  private unsubscribe(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = JSON.stringify({ type: 'unsubscribe', symbol });
    this.ws.send(message);
    this.logger.log(`Unsubscribed from ${symbol}`);
  }

  private disconnect() {
    this.logger.log('Disconnecting from Finnhub WebSocket...');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Unsubscribe from all symbols
      this.symbols.forEach((symbol) => this.unsubscribe(symbol));

      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.logger.log('Disconnected from Finnhub WebSocket');
  }

  // Public method for testing/debugging
  getConnectionStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

