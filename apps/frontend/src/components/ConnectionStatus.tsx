import { Badge } from './ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus as ConnectionStatusType } from '../types/crypto';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export const ConnectionStatus = ({ status }: ConnectionStatusProps) => {
  const statusConfig = {
    connected: {
      label: 'Connected',
      icon: Wifi,
      variant: 'success' as const,
    },
    connecting: {
      label: 'Connecting...',
      icon: Wifi,
      variant: 'warning' as const,
    },
    reconnecting: {
      label: 'Reconnecting...',
      icon: Wifi,
      variant: 'warning' as const,
    },
    disconnected: {
      label: 'Disconnected',
      icon: WifiOff,
      variant: 'danger' as const,
    },
    error: {
      label: 'Error',
      icon: WifiOff,
      variant: 'danger' as const,
    },
    slow: {
      label: 'Slow Connection',
      icon: Wifi,
      variant: 'warning' as const,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="px-3 py-1">
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {config.label}
    </Badge>
  );
};

