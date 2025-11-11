import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, decimals: number = 2): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
}

export function symbolToPair(symbol: string): string {
  // Convert "BINANCE:ETHUSDC" to "ETH/USDC"
  const pair = symbol.replace('BINANCE:', '');
  
  if (pair.includes('ETHUSDC')) return 'ETH/USDC';
  if (pair.includes('ETHUSDT')) return 'ETH/USDT';
  if (pair.includes('ETHBTC')) return 'ETH/BTC';
  
  return pair;
}

export function calculatePercentageChange(current: number, average: number): number {
  if (average === 0) return 0;
  return ((current - average) / average) * 100;
}

