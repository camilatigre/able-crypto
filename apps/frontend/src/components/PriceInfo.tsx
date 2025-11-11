import { formatPrice } from '../lib/utils';

interface PriceInfoProps {
  currentPrice: number;
  hourlyAverage: number;
  lastUpdate: string;
  decimals: number;
}

export const PriceInfo = ({
  currentPrice,
  hourlyAverage,
  lastUpdate,
  decimals,
}: PriceInfoProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline border-b border-border pb-3">
        <span className="text-muted-foreground text-sm font-sans">
          Current Price
        </span>
        {currentPrice > 0 ? (
          <span className="text-3xl font-serif font-semibold text-foreground">
            ${formatPrice(currentPrice, decimals)}
          </span>
        ) : (
          <span className="text-base font-sans text-muted-foreground italic">
            Waiting for first trade...
          </span>
        )}
      </div>
      
      <div className="flex justify-between items-baseline">
        <span className="text-muted-foreground text-sm font-sans">
          Hourly Average
        </span>
        {hourlyAverage > 0 ? (
          <span className="text-lg font-sans font-medium text-foreground">
            ${formatPrice(hourlyAverage, decimals)}
          </span>
        ) : (
          <span className="text-xs font-sans text-muted-foreground italic">
            Calculating average...
          </span>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground font-sans pt-1">
        Last update: {lastUpdate || 'Never'}
      </div>
    </div>
  );
};

