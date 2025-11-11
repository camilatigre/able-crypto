import { useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import { useWebSocket, useWebSocketEvent } from '../hooks/useWebSocket';
import { useCryptoData } from '../hooks/useCryptoData';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Banner } from '../components/Banner';
import { PriceCard } from '../components/PriceCard';
import { PriceCardSkeleton } from '../components/PriceCardSkeleton';
import { EmptyState } from '../components/EmptyState';
import { CRYPTO_SYMBOLS } from '@able-crypto/shared';
import type { PriceUpdate, HourlyAverage, InitialData } from '../types/crypto';

const Dashboard = () => {
  const { socket, connectionStatus, retryConnection } = useWebSocket();
  const {
    cryptoData,
    handlePriceUpdate,
    handleHourlyAverage,
    handleInitialData,
    isSlow,
  } = useCryptoData();

  // Listen to WebSocket events
  useWebSocketEvent<PriceUpdate>(socket, 'price:update', useCallback(handlePriceUpdate, [handlePriceUpdate]));
  useWebSocketEvent<HourlyAverage>(socket, 'hourly:average', useCallback(handleHourlyAverage, [handleHourlyAverage]));
  useWebSocketEvent<InitialData>(socket, 'initial:data', useCallback(handleInitialData, [handleInitialData]));

  const isLoading = connectionStatus === 'connecting';
  const isError = connectionStatus === 'error';
  const isReconnecting = connectionStatus === 'reconnecting' || connectionStatus === 'disconnected';
  const displayStatus = isSlow ? 'slow' : connectionStatus;

  const symbols = [
    CRYPTO_SYMBOLS.ETH_USDC,
    CRYPTO_SYMBOLS.ETH_USDT,
    CRYPTO_SYMBOLS.ETH_BTC,
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-4xl font-serif font-bold text-foreground">
                  Crypto Dashboard
                </h1>
                <p className="text-muted-foreground text-sm mt-1 font-sans">
                  Real-time cryptocurrency exchange rates
                </p>
              </div>
            </div>
            <ConnectionStatus status={displayStatus} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Banners for different states */}
        {isReconnecting && <Banner type="reconnecting" onRetry={retryConnection} />}
        {isError && <Banner type="error" onRetry={retryConnection} />}
        {isSlow && <Banner type="slow" />}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <PriceCardSkeleton />
              <PriceCardSkeleton />
              <PriceCardSkeleton />
            </>
          ) : (
            symbols.map((symbol) => {
              const data = cryptoData.get(symbol);
              
              if (!data || data.currentPrice === 0) {
                return <EmptyState key={symbol} pair={data?.pair || symbol} />;
              }

              return <PriceCard key={symbol} data={data} />;
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-muted-foreground text-sm pt-16 pb-8 font-sans">
          Data updates every second · Powered by Finnhub API
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

