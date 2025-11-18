import { Test, TestingModule } from '@nestjs/testing';
import { BufferManager } from './buffer-manager.service';

describe('BufferManager', () => {
  let service: BufferManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BufferManager],
    }).compile();

    service = module.get<BufferManager>(BufferManager);
  });

  afterEach(() => {
    service.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPrice', () => {
    it('should add first price and return true', () => {
      const symbol = 'BINANCE:ETHUSDC';
      const isFirst = service.addPrice(symbol, 1850, Date.now());

      expect(isFirst).toBe(true);
      expect(service.hasPrices(symbol)).toBe(true);
    });

    it('should add subsequent prices and return false', () => {
      const symbol = 'BINANCE:ETHUSDC';

      service.addPrice(symbol, 1850, Date.now());
      const isFirst = service.addPrice(symbol, 1860, Date.now());

      expect(isFirst).toBe(false);
    });

    it('should accumulate multiple prices', () => {
      const symbol = 'BINANCE:ETHUSDC';

      service.addPrice(symbol, 1850, Date.now());
      service.addPrice(symbol, 1860, Date.now());
      service.addPrice(symbol, 1855, Date.now());

      const prices = service.getPrices(symbol);
      expect(prices).toHaveLength(3);
    });
  });

  describe('getPrices', () => {
    it('should return undefined for unknown symbol', () => {
      const prices = service.getPrices('UNKNOWN');
      expect(prices).toBeUndefined();
    });

    it('should return all prices for symbol', () => {
      const symbol = 'BINANCE:ETHUSDC';
      const timestamp = Date.now();

      service.addPrice(symbol, 1850, timestamp);
      service.addPrice(symbol, 1860, timestamp + 1000);

      const prices = service.getPrices(symbol);
      expect(prices).toEqual([
        { price: 1850, timestamp },
        { price: 1860, timestamp: timestamp + 1000 },
      ]);
    });
  });

  describe('hasPrices', () => {
    it('should return false for unknown symbol', () => {
      expect(service.hasPrices('UNKNOWN')).toBe(false);
    });

    it('should return true when prices exist', () => {
      const symbol = 'BINANCE:ETHUSDC';
      service.addPrice(symbol, 1850, Date.now());

      expect(service.hasPrices(symbol)).toBe(true);
    });

    it('should return false after clearing', () => {
      const symbol = 'BINANCE:ETHUSDC';
      service.addPrice(symbol, 1850, Date.now());
      service.clear(symbol);

      expect(service.hasPrices(symbol)).toBe(false);
    });
  });

  describe('getAverage', () => {
    it('should return null for unknown symbol', () => {
      expect(service.getAverage('UNKNOWN')).toBeNull();
    });

    it('should calculate correct average', () => {
      const symbol = 'BINANCE:ETHUSDC';

      service.addPrice(symbol, 1850, Date.now());
      service.addPrice(symbol, 1860, Date.now());
      service.addPrice(symbol, 1840, Date.now());

      const avg = service.getAverage(symbol);
      expect(avg).toBe(1850); // (1850 + 1860 + 1840) / 3
    });

    it('should handle single price', () => {
      const symbol = 'BINANCE:ETHUSDC';
      service.addPrice(symbol, 1850.5, Date.now());

      expect(service.getAverage(symbol)).toBe(1850.5);
    });
  });

  describe('clear', () => {
    it('should remove buffer for symbol', () => {
      const symbol = 'BINANCE:ETHUSDC';
      service.addPrice(symbol, 1850, Date.now());

      service.clear(symbol);

      expect(service.hasPrices(symbol)).toBe(false);
      expect(service.getAverage(symbol)).toBeNull();
    });
  });

  describe('getAllSymbols', () => {
    it('should return empty array initially', () => {
      expect(service.getAllSymbols()).toEqual([]);
    });

    it('should return all symbols with buffered prices', () => {
      service.addPrice('BINANCE:ETHUSDC', 1850, Date.now());
      service.addPrice('BINANCE:ETHUSDT', 1845, Date.now());
      service.addPrice('BINANCE:ETHBTC', 0.05, Date.now());

      const symbols = service.getAllSymbols();
      expect(symbols).toHaveLength(3);
      expect(symbols).toContain('BINANCE:ETHUSDC');
      expect(symbols).toContain('BINANCE:ETHUSDT');
      expect(symbols).toContain('BINANCE:ETHBTC');
    });
  });

  describe('scheduleInitialAverage', () => {
    it('should call callback after delay', (done) => {
      const symbol = 'BINANCE:ETHUSDC';
      const callback = jest.fn();

      service.scheduleInitialAverage(symbol, callback, 50);

      expect(callback).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });

    it('should not schedule if initial average already sent', (done) => {
      const symbol = 'BINANCE:ETHUSDC';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.scheduleInitialAverage(symbol, callback1, 50);

      setTimeout(() => {
        expect(callback1).toHaveBeenCalledTimes(1);
        
        // Try scheduling again
        service.scheduleInitialAverage(symbol, callback2, 50);

        setTimeout(() => {
          expect(callback2).not.toHaveBeenCalled();
          done();
        }, 100);
      }, 100);
    });

    it('should mark initial average as sent after callback', (done) => {
      const symbol = 'BINANCE:ETHUSDC';
      const callback = jest.fn();

      expect(service.wasInitialAverageSent(symbol)).toBe(false);

      service.scheduleInitialAverage(symbol, callback, 50);

      setTimeout(() => {
        expect(service.wasInitialAverageSent(symbol)).toBe(true);
        done();
      }, 100);
    });
  });

  describe('clearAllTimers', () => {
    it('should cancel pending timers', (done) => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.scheduleInitialAverage('SYMBOL1', callback1, 50);
      service.scheduleInitialAverage('SYMBOL2', callback2, 50);

      service.clearAllTimers();

      setTimeout(() => {
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('wasInitialAverageSent', () => {
    it('should return false initially', () => {
      expect(service.wasInitialAverageSent('BINANCE:ETHUSDC')).toBe(false);
    });

    it('should return true after initial average sent', (done) => {
      const symbol = 'BINANCE:ETHUSDC';
      
      service.scheduleInitialAverage(symbol, () => {}, 50);

      setTimeout(() => {
        expect(service.wasInitialAverageSent(symbol)).toBe(true);
        done();
      }, 100);
    });
  });
});

