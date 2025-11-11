import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChangeProps {
  value: number;
}

export const PriceChange = ({ value }: PriceChangeProps) => {
  const isPositive = value >= 0;

  return (
    <span
      className={`flex items-center text-sm font-sans font-medium ${
        isPositive ? 'text-success' : 'text-danger'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-4 h-4 mr-1" />
      ) : (
        <TrendingDown className="w-4 h-4 mr-1" />
      )}
      {isPositive ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
};

