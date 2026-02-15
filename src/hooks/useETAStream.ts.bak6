/**
 * Hook for consuming live ETA updates via Server-Sent Events
 * Connects to /api/routes/[routeId]/eta-stream for real-time ETA streaming
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ETAStreamMessage {
  type: 'connected' | 'eta_update' | 'route_completed' | 'error';
  etas?: Array<{
    stopId: string;
    currentETA: string;
    delayMinutes: number;
    trafficLevel: string;
    confidence: string;
  }>;
  notifications?: string[];
  message?: string;
  timestamp: string;
}

export interface UseETAStreamOptions {
  routeId: string;
  enabled?: boolean;
  onUpdate?: (message: ETAStreamMessage) => void;
  onError?: (error: string) => void;
  onConnectionStateChange?: (connected: boolean) => void;
}

export function useETAStream(options: UseETAStreamOptions) {
  const { routeId, enabled = true, onUpdate, onError, onConnectionStateChange } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [latestETAs, setLatestETAs] = useState<ETAStreamMessage['etas']>(undefined);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !routeId) return;

    try {
      const eventSource = new EventSource(`/api/routes/${routeId}/eta-stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        onConnectionStateChange?.(true);
      };

      eventSource.onmessage = (event: MessageEvent) => {
        try {
          const message: ETAStreamMessage = JSON.parse(event.data);

          // Update ETAs if provided
          if (message.etas) {
            setLatestETAs(message.etas);
          }

          // Call user callback
          onUpdate?.(message);

          // Handle route completion
          if (message.type === 'route_completed') {
            eventSource.close();
            setIsConnected(false);
            onConnectionStateChange?.(false);
          }
        } catch (parseError) {
          console.error('Error parsing ETA message:', parseError);
        }
      };

      eventSource.onerror = () => {
        const errorMsg = 'Lost connection to ETA stream';
        setError(errorMsg);
        setIsConnected(false);
        onError?.(errorMsg);
        onConnectionStateChange?.(false);
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to ETA stream';
      setError(errorMsg);
      setIsConnected(false);
      onError?.(errorMsg);
      onConnectionStateChange?.(false);
    }
  }, [enabled, routeId, onUpdate, onError, onConnectionStateChange]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setLatestETAs(undefined);
  }, []);

  useEffect(() => {
    if (enabled && routeId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, routeId, connect, disconnect]);

  return {
    isConnected,
    latestETAs,
    error,
    reconnect: connect,
    disconnect,
  };
}
