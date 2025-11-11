import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceCard } from './PriceCard';
import type { CryptoData } from '../types/crypto';

// Mock Chart.js to avoid canvas errors in tests
vi.mock('./PriceChart', () => ({
  PriceChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="price-chart">
      {data.length > 0 ? 'Chart' : 'No chart data yet'}
    </div>
  ),
}));

const mockData: CryptoData = {
  pair: 'ETH/USDC',
  currentPrice: 2456.78,
  lastUpdate: '5 seconds ago',
  lastUpdateTimestamp: Date.now(),
  hourlyAverage: 2448.32,
  priceChange: 1.24,
  chartData: [
    { time: '10:00', price: 2450 },
    { time: '10:01', price: 2455 },
    { time: '10:02', price: 2460 },
  ],
};

describe('PriceCard', () => {
  it('should render pair name', () => {
    render(<PriceCard data={mockData} />);
    expect(screen.getByText('ETH/USDC')).toBeInTheDocument();
  });

  it('should render current price', () => {
    render(<PriceCard data={mockData} />);
    expect(screen.getByText('$2,456.78')).toBeInTheDocument();
  });

  it('should render hourly average', () => {
    render(<PriceCard data={mockData} />);
    expect(screen.getByText('$2,448.32')).toBeInTheDocument();
  });

  it('should render last update', () => {
    render(<PriceCard data={mockData} />);
    expect(screen.getByText(/Last update: 5 seconds ago/)).toBeInTheDocument();
  });

  it('should show positive price change with + sign', () => {
    render(<PriceCard data={mockData} />);
    expect(screen.getByText('+1.24%')).toBeInTheDocument();
  });

  it('should show negative price change without + sign', () => {
    const negativeData = { ...mockData, priceChange: -0.36 };
    render(<PriceCard data={negativeData} />);
    expect(screen.getByText('-0.36%')).toBeInTheDocument();
  });

  it('should show "Never" when no last update', () => {
    const noUpdateData = { ...mockData, lastUpdate: '' };
    render(<PriceCard data={noUpdateData} />);
    expect(screen.getByText(/Last update: Never/)).toBeInTheDocument();
  });

  it('should render chart component', () => {
    render(<PriceCard data={mockData} />);
    expect(screen.getByTestId('price-chart')).toBeInTheDocument();
  });

  it('should use 4 decimals for BTC pair', () => {
    const btcData: CryptoData = {
      ...mockData,
      pair: 'ETH/BTC',
      currentPrice: 0.0543,
      hourlyAverage: 0.0544,
    };
    render(<PriceCard data={btcData} />);
    expect(screen.getByText('$0.0543')).toBeInTheDocument();
  });
});

