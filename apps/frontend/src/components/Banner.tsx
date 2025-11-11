import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface BannerProps {
  type: 'reconnecting' | 'error' | 'crashed' | 'slow';
  onRetry?: () => void;
}

export const Banner = ({ type, onRetry }: BannerProps) => {
  const bannerConfig = {
    reconnecting: {
      title: 'Reconnecting to server',
      description: 'Your data is temporarily frozen while we restore the connection.',
      icon: RefreshCw,
      className: 'border-warning/50 bg-warning/10 text-warning-foreground',
      showRetry: true,
    },
    error: {
      title: 'Connection failed',
      description: 'Unable to fetch data. Please try again.',
      icon: AlertCircle,
      className: 'border-danger/50 bg-danger/10 text-danger-foreground',
      showRetry: true,
    },
    crashed: {
      title: 'Backend unavailable',
      description: 'The server is not responding. Data is frozen.',
      icon: WifiOff,
      className: 'border-danger/50 bg-danger/10 text-danger-foreground',
      showRetry: true,
    },
    slow: {
      title: 'Slow connection detected',
      description: 'Data updates may be delayed.',
      icon: AlertCircle,
      className: 'border-blue-500/50 bg-blue-500/10 text-blue-900',
      showRetry: false,
    },
  };

  const config = bannerConfig[type];
  const Icon = config.icon;

  return (
    <Alert className={`${config.className} mb-6`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-serif font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="font-sans flex items-center justify-between">
        <span>{config.description}</span>
        {config.showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

