import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ConnectionStatus } from '../types/crypto';

interface UseWebSocketReturn {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  retryConnection: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const MAX_RETRY_ATTEMPTS = 5;

export const useWebSocket = (): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    setError(null);

    const newSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: MAX_RETRY_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to backend');
      setConnectionStatus('connected');
      setError(null);
      setRetryAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        setConnectionStatus('reconnecting');
      } else {
        setConnectionStatus('disconnected');
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setError(err.message);
      setRetryAttempts(prev => prev + 1);
      
      if (retryAttempts >= MAX_RETRY_ATTEMPTS - 1) {
        setConnectionStatus('error');
      } else {
        setConnectionStatus('reconnecting');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      setError(null);
      setRetryAttempts(0);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS}`);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
      setConnectionStatus('error');
      setError('Failed to reconnect after multiple attempts');
    });

    setSocket(newSocket);

    return newSocket;
  }, [retryAttempts]);

  useEffect(() => {
    const socket = connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const retryConnection = useCallback(() => {
    console.log('🔄 Manual retry triggered');
    setRetryAttempts(0);
    
    if (socket) {
      socket.disconnect();
    }
    
    connect();
  }, [socket, connect]);

  return {
    socket,
    connectionStatus,
    error,
    retryConnection,
  };
};

// Hook to listen for specific WebSocket events
export const useWebSocketEvent = <T,>(
  socket: Socket | null,
  event: string,
  callback: (data: T) => void,
) => {
  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
};

