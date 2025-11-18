import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';

export type MessageHandler = (data: WebSocket.Data) => void;
export type ConnectionHandler = () => void;
export type ErrorHandler = (error: Error) => void;

/**
 * WebSocketClient
 *
 * Low-level WebSocket connection management with reconnection logic.
 * Handles connection lifecycle, error recovery, and exponential backoff.
 */
@Injectable()
export class WebSocketClient implements OnModuleDestroy {
  private readonly logger = new Logger(WebSocketClient.name);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private url: string | null = null;

  private onMessageHandler: MessageHandler | null = null;
  private onOpenHandler: ConnectionHandler | null = null;
  private onCloseHandler: ConnectionHandler | null = null;
  private onErrorHandler: ErrorHandler | null = null;

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * Set message handler
   */
  onMessage(handler: MessageHandler): void {
    this.onMessageHandler = handler;
  }

  /**
   * Set connection opened handler
   */
  onOpen(handler: ConnectionHandler): void {
    this.onOpenHandler = handler;
  }

  /**
   * Set connection closed handler
   */
  onClose(handler: ConnectionHandler): void {
    this.onCloseHandler = handler;
  }

  /**
   * Set error handler
   */
  onError(handler: ErrorHandler): void {
    this.onErrorHandler = handler;
  }

  /**
   * Connect to WebSocket server
   */
  connect(url: string): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.url = url;
    this.isConnecting = true;
    this.logger.log(`Connecting to WebSocket... (attempt ${this.reconnectAttempts + 1})`);

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => this.handleOpen());
      this.ws.on('message', (data: WebSocket.Data) => this.handleMessage(data));
      this.ws.on('error', (error: Error) => this.handleError(error));
      this.ws.on('close', () => this.handleClose());
    } catch (error) {
      this.logger.error('Failed to create WebSocket connection:', (error as Error).message);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.logger.log('Disconnecting from WebSocket...');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.logger.log('Disconnected from WebSocket');
  }

  /**
   * Send message through WebSocket
   */
  send(message: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    this.ws.send(message);
    return true;
  }

  /**
   * Get current connection status
   */
  getStatus(): string {
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

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private handleOpen(): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.logger.log('✅ Connected to WebSocket');

    if (this.onOpenHandler) {
      this.onOpenHandler();
    }
  }

  private handleMessage(data: WebSocket.Data): void {
    if (this.onMessageHandler) {
      this.onMessageHandler(data);
    }
  }

  private handleError(error: Error): void {
    this.logger.error('WebSocket error:', error.message);

    if (this.onErrorHandler) {
      this.onErrorHandler(error);
    }
  }

  private handleClose(): void {
    this.logger.warn('WebSocket connection closed');
    this.ws = null;
    this.isConnecting = false;

    if (this.onCloseHandler) {
      this.onCloseHandler();
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection.`,
      );
      return;
    }

    if (!this.url) {
      this.logger.error('Cannot reconnect: URL not set');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 64000);
    this.reconnectAttempts++;

    this.logger.log(`Reconnecting in ${delay / 1000}s...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.url!);
    }, delay);
  }
}

