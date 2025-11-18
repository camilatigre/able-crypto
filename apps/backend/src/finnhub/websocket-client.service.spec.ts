import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketClient } from './websocket-client.service';
import WebSocket from 'ws';

// Mock the 'ws' module
jest.mock('ws');

describe('WebSocketClient', () => {
  let service: WebSocketClient;
  let mockWs: jest.Mocked<WebSocket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebSocketClient],
    }).compile();

    service = module.get<WebSocketClient>(WebSocketClient);

    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      removeAllListeners: jest.fn(),
      get readyState() {
        return WebSocket.OPEN;
      },
    } as any;

    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Skip disconnect to avoid clearTimeout issues in tests
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connect', () => {
    it('should create WebSocket connection', () => {
      const url = 'wss://example.com';

      service.connect(url);

      expect(WebSocket).toHaveBeenCalledWith(url);
      expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should not connect if already connecting', () => {
      service.connect('wss://example.com');
      const callCount = (WebSocket as unknown as jest.Mock).mock.calls.length;

      service.connect('wss://example.com');

      expect((WebSocket as unknown as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it('should not connect if already connected', () => {
      service.connect('wss://example.com');
      
      const callCount = (WebSocket as unknown as jest.Mock).mock.calls.length;
      service.connect('wss://example.com');

      expect((WebSocket as unknown as jest.Mock).mock.calls.length).toBe(callCount);
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket and cleanup', () => {
      service.connect('wss://example.com');
      service.disconnect();

      expect(mockWs.removeAllListeners).toHaveBeenCalled();
      expect(mockWs.close).toHaveBeenCalled();
    });

    it('should clear reconnect timeout', () => {
      jest.useFakeTimers();
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      service.connect('wss://example.com');
      
      // Simulate close to trigger reconnect scheduling
      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1] as Function;
      if (closeHandler) closeHandler();

      service.disconnect();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('send', () => {
    it('should send message when connected', () => {
      service.connect('wss://example.com');

      const result = service.send('test message');

      expect(result).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith('test message');
    });

    it('should return false when not connected', () => {
      const result = service.send('test message');

      expect(result).toBe(false);
      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return disconnected when no connection', () => {
      expect(service.getStatus()).toBe('disconnected');
    });

    it('should return connected when open', () => {
      service.connect('wss://example.com');

      expect(service.getStatus()).toBe('connected');
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      service.connect('wss://example.com');

      expect(service.isConnected()).toBe(true);
    });
  });

  describe('event handlers', () => {
    it('should call onOpen handler when connection opens', () => {
      const handler = jest.fn();
      service.onOpen(handler);
      service.connect('wss://example.com');

      const openHandler = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1] as Function;
      openHandler();

      expect(handler).toHaveBeenCalled();
    });

    it('should call onMessage handler when message received', () => {
      const handler = jest.fn();
      service.onMessage(handler);
      service.connect('wss://example.com');

      const messageHandler = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1] as Function;
      const testData = Buffer.from('test');
      messageHandler(testData);

      expect(handler).toHaveBeenCalledWith(testData);
    });

    it('should call onError handler on error', () => {
      const handler = jest.fn();
      service.onError(handler);
      service.connect('wss://example.com');

      const errorHandler = mockWs.on.mock.calls.find(call => call[0] === 'error')?.[1] as Function;
      const testError = new Error('test error');
      errorHandler(testError);

      expect(handler).toHaveBeenCalledWith(testError);
    });

    it('should call onClose handler when connection closes', (done) => {
      const handler = jest.fn();
      service.onClose(handler);
      service.connect('wss://example.com');

      const closeHandler = mockWs.on.mock.calls.find(call => call[0] === 'close')?.[1] as Function;
      closeHandler();

      setTimeout(() => {
        expect(handler).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect on module destroy', () => {
      service.connect('wss://example.com');
      
      service.onModuleDestroy();

      expect(mockWs.close).toHaveBeenCalled();
    });
  });
});

