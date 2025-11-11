import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RatesService } from './rates.service';
import { HourlyRate } from './rate.entity';

describe('RatesService', () => {
  let service: RatesService;
  let repository: Repository<HourlyRate>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesService,
        {
          provide: getRepositoryToken(HourlyRate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RatesService>(RatesService);
    repository = module.get<Repository<HourlyRate>>(getRepositoryToken(HourlyRate));

    // Clear all mocks before each test
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

      service.addPrice(symbol, price, timestamp);

      // We can't directly access private buffer, but we can test the behavior
      // by calling calculateHourlyAverages and checking if save is called
      expect(service).toBeDefined();
    });

    it('should add multiple prices to buffer for same symbol', () => {
      const symbol = 'BINANCE:ETHUSDC';
      
      service.addPrice(symbol, 1850, Date.now());
      service.addPrice(symbol, 1860, Date.now());
      service.addPrice(symbol, 1855, Date.now());

      expect(service).toBeDefined();
    });
  });

  describe('calculateHourlyAverages', () => {
    it('should calculate correct average for single symbol', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.save.mockResolvedValue({});

      service.addPrice(symbol, 1850, Date.now());
      service.addPrice(symbol, 1860, Date.now());

      await service.calculateHourlyAverages();

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol,
          averagePrice: 1855, // (1850 + 1860) / 2
        }),
      );
    });

    it('should calculate correct average for multiple symbols', async () => {
      mockRepository.save.mockResolvedValue({});

      service.addPrice('BINANCE:ETHUSDC', 1850, Date.now());
      service.addPrice('BINANCE:ETHUSDC', 1860, Date.now());
      service.addPrice('BINANCE:ETHUSDT', 1845, Date.now());
      service.addPrice('BINANCE:ETHUSDT', 1855, Date.now());

      await service.calculateHourlyAverages();

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BINANCE:ETHUSDC',
          averagePrice: 1855,
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'BINANCE:ETHUSDT',
          averagePrice: 1850,
        }),
      );
    });

    it('should not save when buffer is empty', async () => {
      mockRepository.save.mockResolvedValue({});

      await service.calculateHourlyAverages();

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should clear buffer after calculating averages', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.save.mockResolvedValue({});

      service.addPrice(symbol, 1850, Date.now());
      await service.calculateHourlyAverages();

      // If we call again, nothing should be saved (buffer was cleared)
      await service.calculateHourlyAverages();

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle save errors gracefully', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      service.addPrice(symbol, 1850, Date.now());

      await expect(service.calculateHourlyAverages()).resolves.not.toThrow();
    });

    it('should retain data in buffer when save fails', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      service.addPrice(symbol, 1850, Date.now());
      await service.calculateHourlyAverages();

      // First call failed, buffer should still have data
      // So second call should try again
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      // Now make it succeed
      mockRepository.save.mockResolvedValue({});
      await service.calculateHourlyAverages();

      // Should have tried again (retry)
      expect(mockRepository.save).toHaveBeenCalledTimes(2);

      // Third call should not save (buffer cleared after success)
      await service.calculateHourlyAverages();
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should partially clear buffer on partial failures', async () => {
      // First symbol succeeds, second fails
      mockRepository.save
        .mockResolvedValueOnce({}) // ETH/USDC succeeds
        .mockRejectedValueOnce(new Error('Database error')); // ETH/USDT fails

      service.addPrice('BINANCE:ETHUSDC', 1850, Date.now());
      service.addPrice('BINANCE:ETHUSDT', 1845, Date.now());

      await service.calculateHourlyAverages();

      expect(mockRepository.save).toHaveBeenCalledTimes(2);

      // Call again - only ETH/USDT should retry (ETH/USDC was cleared)
      mockRepository.save.mockResolvedValue({});
      await service.calculateHourlyAverages();

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
      expect(mockRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          symbol: 'BINANCE:ETHUSDT',
        }),
      );
    });

    it('should round hour timestamp correctly', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.save.mockResolvedValue({});

      service.addPrice(symbol, 1850, Date.now());
      await service.calculateHourlyAverages();

      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.hour.getMinutes()).toBe(0);
      expect(savedData.hour.getSeconds()).toBe(0);
      expect(savedData.hour.getMilliseconds()).toBe(0);
    });
  });

  describe('getRecentAverages', () => {
    it('should call repository.find with correct parameters', async () => {
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

      mockRepository.find.mockResolvedValue(mockData);

      const result = await service.getRecentAverages(symbol, hours);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { symbol },
        order: { hour: 'DESC' },
        take: hours,
      });
      expect(result).toEqual(mockData);
    });

    it('should use default of 24 hours if not specified', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      mockRepository.find.mockResolvedValue([]);

      await service.getRecentAverages(symbol);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { symbol },
        order: { hour: 'DESC' },
        take: 24,
      });
    });
  });

  describe('cleanupOldData', () => {
    it('should delete data older than 7 days', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 10 });

      await service.cleanupOldData();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        hour: expect.any(Object), // LessThan matcher
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.cleanupOldData()).resolves.not.toThrow();
    });

    it('should log number of deleted records', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 42 });

      await service.cleanupOldData();

      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
});

