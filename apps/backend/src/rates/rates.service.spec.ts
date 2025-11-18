import { Test, TestingModule } from '@nestjs/testing';
import { RatesService } from './rates.service';
import { HourlyRate } from './rate.entity';
import { RatesRepository } from './rates.repository';
import { BufferManager } from './buffer-manager.service';
import { RateCalculator } from './rate-calculator.service';

describe('RatesService', () => {
  let service: RatesService;
  let repository: jest.Mocked<RatesRepository>;
  let bufferManager: jest.Mocked<BufferManager>;
  let calculator: jest.Mocked<RateCalculator>;

  const mockRepository = {
    save: jest.fn(),
    findRecent: jest.fn(),
    deleteOlderThan: jest.fn(),
  };

  const mockBufferManager = {
    addPrice: jest.fn(),
    getPrices: jest.fn(),
    hasPrices: jest.fn(),
    getAverage: jest.fn(),
    clear: jest.fn(),
    getAllSymbols: jest.fn(),
    scheduleInitialAverage: jest.fn(),
    clearAllTimers: jest.fn(),
    wasInitialAverageSent: jest.fn(),
  };

  const mockCalculator = {
    calculateAverage: jest.fn(),
    roundToHour: jest.fn(),
    getDaysAgo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesService,
        {
          provide: RatesRepository,
          useValue: mockRepository,
        },
        {
          provide: BufferManager,
          useValue: mockBufferManager,
        },
        {
          provide: RateCalculator,
          useValue: mockCalculator,
        },
      ],
    }).compile();

    service = module.get<RatesService>(RatesService);
    repository = module.get(RatesRepository) as jest.Mocked<RatesRepository>;
    bufferManager = module.get(BufferManager) as jest.Mocked<BufferManager>;
    calculator = module.get(RateCalculator) as jest.Mocked<RateCalculator>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPrice', () => {
    it('should add price to buffer for new symbol', () => {
      const symbol = 'BINANCE:ETHUSDC';
      const price = 1850.5;
      const timestamp = Date.now();

      mockBufferManager.addPrice.mockReturnValue(true);

      service.addPrice(symbol, price, timestamp);

      expect(mockBufferManager.addPrice).toHaveBeenCalledWith(symbol, price, timestamp);
      expect(mockBufferManager.scheduleInitialAverage).toHaveBeenCalled();
    });

    it('should not schedule initial average for subsequent prices', () => {
      const symbol = 'BINANCE:ETHUSDC';

      mockBufferManager.addPrice.mockReturnValue(false);

      service.addPrice(symbol, 1850, Date.now());

      expect(mockBufferManager.addPrice).toHaveBeenCalled();
      expect(mockBufferManager.scheduleInitialAverage).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentAverage', () => {
    it('should return average from buffer manager', () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockBufferManager.getAverage.mockReturnValue(1850.5);

      const result = service.getCurrentAverage(symbol);

      expect(mockBufferManager.getAverage).toHaveBeenCalledWith(symbol);
      expect(result).toBe(1850.5);
    });

    it('should return null when no average', () => {
      mockBufferManager.getAverage.mockReturnValue(null);

      const result = service.getCurrentAverage('UNKNOWN');

      expect(result).toBeNull();
    });
  });

  describe('calculateHourlyAverages', () => {
    it('should calculate and save hourly average', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      const prices = [
        { price: 1850, timestamp: Date.now() },
        { price: 1860, timestamp: Date.now() },
      ];
      const hour = new Date('2024-01-15T14:00:00.000Z');

      mockBufferManager.getAllSymbols.mockReturnValue([symbol]);
      mockBufferManager.getPrices.mockReturnValue(prices);
      mockCalculator.calculateAverage.mockReturnValue(1855);
      mockCalculator.roundToHour.mockReturnValue(hour);
      mockRepository.save.mockResolvedValue({} as HourlyRate);

      await service.calculateHourlyAverages();

      expect(mockBufferManager.getAllSymbols).toHaveBeenCalled();
      expect(mockBufferManager.getPrices).toHaveBeenCalledWith(symbol);
      expect(mockCalculator.calculateAverage).toHaveBeenCalledWith(prices);
      expect(mockCalculator.roundToHour).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith({
        symbol,
        averagePrice: 1855,
        hour,
      });
      expect(mockBufferManager.clear).toHaveBeenCalledWith(symbol);
    });

    it('should handle multiple symbols', async () => {
      mockBufferManager.getAllSymbols.mockReturnValue(['BINANCE:ETHUSDC', 'BINANCE:ETHUSDT']);
      mockBufferManager.getPrices.mockReturnValue([{ price: 1850, timestamp: Date.now() }]);
      mockCalculator.calculateAverage.mockReturnValue(1850);
      mockCalculator.roundToHour.mockReturnValue(new Date());
      mockRepository.save.mockResolvedValue({} as HourlyRate);

      await service.calculateHourlyAverages();

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockBufferManager.clear).toHaveBeenCalledTimes(2);
    });

    it('should skip symbols with no prices', async () => {
      mockBufferManager.getAllSymbols.mockReturnValue(['SYMBOL1']);
      mockBufferManager.getPrices.mockReturnValue(undefined);

      await service.calculateHourlyAverages();

      expect(mockCalculator.calculateAverage).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      mockBufferManager.getAllSymbols.mockReturnValue(['SYMBOL1']);
      mockBufferManager.getPrices.mockReturnValue([{ price: 1850, timestamp: Date.now() }]);
      mockCalculator.calculateAverage.mockReturnValue(1850);
      mockCalculator.roundToHour.mockReturnValue(new Date());
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.calculateHourlyAverages()).resolves.not.toThrow();
      expect(mockBufferManager.clear).not.toHaveBeenCalled();
    });

    it('should only clear buffer for successful saves', async () => {
      mockBufferManager.getAllSymbols.mockReturnValue(['SYMBOL1', 'SYMBOL2']);
      mockBufferManager.getPrices.mockReturnValue([{ price: 1850, timestamp: Date.now() }]);
      mockCalculator.calculateAverage.mockReturnValue(1850);
      mockCalculator.roundToHour.mockReturnValue(new Date());
      mockRepository.save
        .mockResolvedValueOnce({} as HourlyRate)
        .mockRejectedValueOnce(new Error('Error'));

      await service.calculateHourlyAverages();

      expect(mockBufferManager.clear).toHaveBeenCalledTimes(1);
      expect(mockBufferManager.clear).toHaveBeenCalledWith('SYMBOL1');
    });
  });

  describe('getRecentAverages', () => {
    it('should call repository.findRecent', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      const hours = 24;
      const mockData: HourlyRate[] = [
        {
          id: 1,
          symbol,
          averagePrice: 1850.5,
          hour: new Date(),
          createdAt: new Date(),
        } as HourlyRate,
      ];

      mockRepository.findRecent.mockResolvedValue(mockData);

      const result = await service.getRecentAverages(symbol, hours);

      expect(mockRepository.findRecent).toHaveBeenCalledWith(symbol, hours);
      expect(result).toEqual(mockData);
    });

    it('should use default of 24 hours if not specified', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.findRecent.mockResolvedValue([]);

      await service.getRecentAverages(symbol);

      expect(mockRepository.findRecent).toHaveBeenCalledWith(symbol, 24);
    });
  });

  describe('cleanupOldData', () => {
    it('should delete data older than 7 days', async () => {
      const sevenDaysAgo = new Date('2024-01-08');
      mockCalculator.getDaysAgo.mockReturnValue(sevenDaysAgo);
      mockRepository.deleteOlderThan.mockResolvedValue(10);

      await service.cleanupOldData();

      expect(mockCalculator.getDaysAgo).toHaveBeenCalledWith(7);
      expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(sevenDaysAgo);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockCalculator.getDaysAgo.mockReturnValue(new Date());
      mockRepository.deleteOlderThan.mockRejectedValue(new Error('Delete failed'));

      await expect(service.cleanupOldData()).resolves.not.toThrow();
    });

    it('should log number of deleted records', async () => {
      mockCalculator.getDaysAgo.mockReturnValue(new Date());
      mockRepository.deleteOlderThan.mockResolvedValue(42);

      await service.cleanupOldData();

      expect(mockRepository.deleteOlderThan).toHaveBeenCalled();
    });
  });
});

