import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const client = new Client({
      brokerURL: `ws://${window.location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => console.debug('WebSocket connected'),
      onStompError: (frame) => console.error('STOMP error', frame),
    });

    client.activate();
    clientRef.current = client;
    return client;
  }, []);

  const subscribeConsole = (serverId: string, onLine: (line: string) => void) => {
    return clientRef.current?.subscribe(`/topic/console/${serverId}`, (msg) => {
      onLine(JSON.parse(msg.body).line);
    });
  };

  const subscribeStatus = (serverId: string, onStatus: (data: { serverId: string; status: string }) => void) => {
    return clientRef.current?.subscribe(`/topic/status/${serverId}`, (msg) => {
      onStatus(JSON.parse(msg.body));
    });
  };

  const subscribeMetrics = (serverId: string, onMetrics: (data: Record<string, unknown>) => void) => {
    return clientRef.current?.subscribe(`/topic/metrics/${serverId}`, (msg) => {
      onMetrics(JSON.parse(msg.body));
    });
  };

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
  }, []);

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return { connect, subscribeConsole, subscribeStatus, subscribeMetrics, disconnect };
}
