import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PriceChange } from './PriceChange';
import { PriceInfo } from './PriceInfo';
import { PriceChart } from './PriceChart';
import type { CryptoData } from '../types/crypto';

interface PriceCardProps {
  data: CryptoData;
}

/**
 * PriceCard - Container component following best practices:
 * 
 * ✅ Single Responsibility: Composes smaller, focused components
 * ✅ Separation of Concerns: Logic extracted to helpers and child components
 * ✅ Reusability: Child components can be used independently
 * ✅ Testability: Each part can be tested in isolation
 * ✅ Maintainability: Changes to one part don't affect others
 */
export const PriceCard = ({ data }: PriceCardProps) => {
  // Pure calculation - could be extracted to utils if used elsewhere
  const decimals = data.pair === 'ETH/BTC' ? 4 : 2;
  const isPositive = data.priceChange >= 0;

  return (
    <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-serif font-semibold flex items-center justify-between">
          <span className="text-foreground">{data.pair}</span>
          <PriceChange value={data.priceChange} />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <PriceInfo
          currentPrice={data.currentPrice}
          hourlyAverage={data.hourlyAverage}
          lastUpdate={data.lastUpdate}
          decimals={decimals}
        />

        <div className="h-40 w-full">
          <PriceChart data={data.chartData} isPositive={isPositive} />
        </div>
      </CardContent>
    </Card>
  );
};

