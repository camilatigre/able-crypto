import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RatesRepository } from './rates.repository';
import { HourlyRate } from './rate.entity';

describe('RatesRepository', () => {
  let repository: RatesRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<HourlyRate>>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesRepository,
        {
          provide: getRepositoryToken(HourlyRate),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<RatesRepository>(RatesRepository);
    mockTypeOrmRepository = module.get(getRepositoryToken(HourlyRate));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save a rate record', async () => {
      const rateData = {
        symbol: 'BINANCE:ETHUSDC',
        averagePrice: 1850.5,
        hour: new Date(),
      };

      const savedRate = { id: 1, ...rateData, createdAt: new Date() };
      mockRepository.save.mockResolvedValue(savedRate as HourlyRate);

      const result = await repository.save(rateData);

      expect(mockRepository.save).toHaveBeenCalledWith(rateData);
      expect(result).toEqual(savedRate);
    });

    it('should handle save errors', async () => {
      const rateData = {
        symbol: 'BINANCE:ETHUSDC',
        averagePrice: 1850.5,
        hour: new Date(),
      };

      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(rateData)).rejects.toThrow('Database error');
    });
  });

  describe('findRecent', () => {
    it('should find recent rates for a symbol', async () => {
      const symbol = 'BINANCE:ETHUSDC';
      const hours = 24;

      const mockRates: HourlyRate[] = [
        {
          id: 1,
          symbol,
          averagePrice: 1850.5,
          hour: new Date(),
          createdAt: new Date(),
        } as HourlyRate,
        {
          id: 2,
          symbol,
          averagePrice: 1845.2,
          hour: new Date(Date.now() - 3600000),
          createdAt: new Date(),
        } as HourlyRate,
      ];

      mockRepository.find.mockResolvedValue(mockRates);

      const result = await repository.findRecent(symbol, hours);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { symbol },
        order: { hour: 'DESC' },
        take: hours,
      });
      expect(result).toEqual(mockRates);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no rates found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findRecent('BINANCE:ETHUSDC', 24);

      expect(result).toEqual([]);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete old records and return count', async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      mockRepository.delete.mockResolvedValue({ affected: 42, raw: {} });

      const result = await repository.deleteOlderThan(sevenDaysAgo);

      expect(mockRepository.delete).toHaveBeenCalledWith({
        hour: LessThan(sevenDaysAgo),
      });
      expect(result).toBe(42);
    });

    it('should return 0 when no records deleted', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(0);
    });

    it('should return 0 when affected is undefined', async () => {
      mockRepository.delete.mockResolvedValue({ raw: {} });

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(0);
    });
  });
});

