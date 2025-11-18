import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FinnhubService } from './finnhub.service';
import { RatesService } from '../rates/rates.service';
import { FinnhubGateway } from './finnhub.gateway';
import { WebSocketClient } from './websocket-client.service';

describe('FinnhubService', () => {
  let service: FinnhubService;
  let configService: jest.Mocked<ConfigService>;
  let ratesService: jest.Mocked<RatesService>;
  let wsClient: jest.Mocked<WebSocketClient>;
  let gateway: jest.Mocked<FinnhubGateway>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRatesService = {
    addPrice: jest.fn(),
  };

  const mockWsClient = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    onOpen: jest.fn(),
    onMessage: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
    getStatus: jest.fn(),
    isConnected: jest.fn(),
  };

  const mockGateway = {
    broadcastPriceUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinnhubService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RatesService,
          useValue: mockRatesService,
        },
        {
          provide: WebSocketClient,
          useValue: mockWsClient,
        },
        {
          provide: FinnhubGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<FinnhubService>(FinnhubService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    ratesService = module.get(RatesService) as jest.Mocked<RatesService>;
    wsClient = module.get(WebSocketClient) as jest.Mocked<WebSocketClient>;
    gateway = module.get(FinnhubGateway) as jest.Mocked<FinnhubGateway>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should setup handlers and connect', () => {
      mockConfigService.get.mockReturnValue('test-api-key');

      service.onModuleInit();

      expect(mockWsClient.onOpen).toHaveBeenCalled();
      expect(mockWsClient.onMessage).toHaveBeenCalled();
      expect(mockWsClient.onError).toHaveBeenCalled();
      expect(mockWsClient.connect).toHaveBeenCalledWith('wss://ws.finnhub.io?token=test-api-key');
    });

    it('should not connect if API key is missing', () => {
      mockConfigService.get.mockReturnValue(undefined);

      service.onModuleInit();

      expect(mockWsClient.connect).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect WebSocket client', () => {
      service.onModuleDestroy();

      expect(mockWsClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleOpen', () => {
    it('should subscribe to all symbols on connection', () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      mockWsClient.send.mockReturnValue(true);

      service.onModuleInit();

      // Trigger the open handler
      const openHandler = mockWsClient.onOpen.mock.calls[0][0];
      openHandler();

      expect(mockWsClient.send).toHaveBeenCalledTimes(3);
      expect(mockWsClient.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:ETHUSDC' }),
      );
      expect(mockWsClient.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:ETHUSDT' }),
      );
      expect(mockWsClient.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:ETHBTC' }),
      );
    });
  });

  describe('handleMessage', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-api-key');
      service.onModuleInit();
    });

    it('should ignore ping messages', () => {
      const pingMessage = JSON.stringify({ type: 'ping' });
      const messageHandler = mockWsClient.onMessage.mock.calls[0][0];

      messageHandler(Buffer.from(pingMessage));

      expect(mockRatesService.addPrice).not.toHaveBeenCalled();
      expect(mockGateway.broadcastPriceUpdate).not.toHaveBeenCalled();
    });

    it('should process trade messages', () => {
      const tradeMessage = JSON.stringify({
        type: 'trade',
        data: [
          { s: 'BINANCE:ETHUSDC', p: 1850.5, t: 1234567890, v: 10.5 },
          { s: 'BINANCE:ETHUSDT', p: 1845.2, t: 1234567891, v: 5.2 },
        ],
      });

      const messageHandler = mockWsClient.onMessage.mock.calls[0][0];
      messageHandler(Buffer.from(tradeMessage));

      expect(mockRatesService.addPrice).toHaveBeenCalledTimes(2);
      expect(mockRatesService.addPrice).toHaveBeenCalledWith('BINANCE:ETHUSDC', 1850.5, 1234567890);
      expect(mockRatesService.addPrice).toHaveBeenCalledWith('BINANCE:ETHUSDT', 1845.2, 1234567891);

      expect(mockGateway.broadcastPriceUpdate).toHaveBeenCalledTimes(2);
      expect(mockGateway.broadcastPriceUpdate).toHaveBeenCalledWith(
        'BINANCE:ETHUSDC',
        1850.5,
        1234567890,
      );
      expect(mockGateway.broadcastPriceUpdate).toHaveBeenCalledWith(
        'BINANCE:ETHUSDT',
        1845.2,
        1234567891,
      );
    });

    it('should handle empty trade data', () => {
      const tradeMessage = JSON.stringify({
        type: 'trade',
        data: [],
      });

      const messageHandler = mockWsClient.onMessage.mock.calls[0][0];
      messageHandler(Buffer.from(tradeMessage));

      expect(mockRatesService.addPrice).not.toHaveBeenCalled();
    });

    it('should handle parse errors gracefully', () => {
      const invalidMessage = 'not valid json';
      const messageHandler = mockWsClient.onMessage.mock.calls[0][0];

      expect(() => messageHandler(Buffer.from(invalidMessage))).not.toThrow();
      expect(mockRatesService.addPrice).not.toHaveBeenCalled();
    });

    it('should ignore unknown message types', () => {
      const unknownMessage = JSON.stringify({ type: 'unknown' });
      const messageHandler = mockWsClient.onMessage.mock.calls[0][0];

      messageHandler(Buffer.from(unknownMessage));

      expect(mockRatesService.addPrice).not.toHaveBeenCalled();
    });
  });

  describe('handleError', () => {
    it('should log errors', () => {
      mockConfigService.get.mockReturnValue('test-api-key');
      service.onModuleInit();

      const errorHandler = mockWsClient.onError.mock.calls[0][0];
      const testError = new Error('Test error');

      expect(() => errorHandler(testError)).not.toThrow();
    });
  });

  describe('getConnectionStatus', () => {
    it('should return status from WebSocket client', () => {
      mockWsClient.getStatus.mockReturnValue('connected');

      const status = service.getConnectionStatus();

      expect(status).toBe('connected');
      expect(mockWsClient.getStatus).toHaveBeenCalled();
    });
  });
});

