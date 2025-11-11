import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { throttle } from 'lodash';
import { PriceUpdate, HourlyAverage } from '@able-crypto/shared';
import { RatesService } from '../rates/rates.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class FinnhubGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FinnhubGateway.name);
  private connectedClients = 0;

  // Throttled broadcast functions (max 1 per second per symbol)
  private throttledBroadcast: Map<string, (data: PriceUpdate) => void> = new Map();

  constructor(private readonly ratesService: RatesService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    // Initialize throttled functions for each symbol
    const symbols = ['BINANCE:ETHUSDC', 'BINANCE:ETHUSDT', 'BINANCE:ETHBTC'];
    symbols.forEach((symbol) => {
      this.throttledBroadcast.set(
        symbol,
        throttle((data: PriceUpdate) => {
          this.server.emit('price:update', data);
        }, 1000),
      );
    });
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (Total: ${this.connectedClients})`);
    
    // Send initial data on connection
    this.sendInitialData(client);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} (Total: ${this.connectedClients})`);
  }

  /**
   * Broadcast price update to all connected clients (throttled)
   */
  broadcastPriceUpdate(symbol: string, price: number, timestamp: number) {
    const throttledFn = this.throttledBroadcast.get(symbol);
    
    if (throttledFn) {
      throttledFn({ symbol, price, timestamp });
    } else {
      // Fallback for unknown symbols
      this.server.emit('price:update', { symbol, price, timestamp });
    }
  }

  /**
   * Broadcast initial average (from first trades) to all connected clients
   */
  broadcastInitialAverage(symbol: string, averagePrice: number) {
    try {
      const data: HourlyAverage = {
        symbol,
        averagePrice,
        hour: new Date().toISOString(),
      };

      this.server.emit('hourly-average', data);
      this.logger.log(`Broadcast initial average for ${symbol}: ${averagePrice}`);
    } catch (error) {
      this.logger.error('Failed to broadcast initial average:', error.message);
    }
  }

  /**
   * Broadcast hourly average to all connected clients
   */
  async broadcastHourlyAverage(symbol: string) {
    try {
      const averages = await this.ratesService.getRecentAverages(symbol, 1);
      
      if (averages.length > 0) {
        const latest = averages[0];
        const data: HourlyAverage = {
          symbol: latest.symbol,
          averagePrice: Number(latest.averagePrice),
          hour: latest.hour.toISOString(),
        };

        this.server.emit('hourly:average', data);
        this.logger.log(`Broadcasted hourly average for ${symbol}: ${data.averagePrice}`);
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast hourly average for ${symbol}:`, error.message);
    }
  }

  /**
   * Send initial data when client connects
   */
  private async sendInitialData(client: Socket) {
    try {
      const symbols = ['BINANCE:ETHUSDC', 'BINANCE:ETHUSDT', 'BINANCE:ETHBTC'];
      
      for (const symbol of symbols) {
        const averages = await this.ratesService.getRecentAverages(symbol, 24);
        
        if (averages.length > 0) {
          const data: HourlyAverage[] = averages.map((avg) => ({
            symbol: avg.symbol,
            averagePrice: Number(avg.averagePrice),
            hour: avg.hour.toISOString(),
          }));

          client.emit('initial:data', { symbol, averages: data });
        }
      }

      this.logger.log(`Sent initial data to client ${client.id}`);
    } catch (error) {
      this.logger.error('Failed to send initial data:', error.message);
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedClients(): number {
    return this.connectedClients;
  }
}

