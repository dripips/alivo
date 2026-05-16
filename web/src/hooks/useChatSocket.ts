import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  text: string;
  buttons?: Array<{ label: string; callbackData: string }>;
}

export function useChatSocket(userId: string | null, enabled = false) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [incoming, setIncoming] = useState<ChatMessage | null>(null);

  useEffect(() => {
    if (!userId || !enabled) return;

    const socket = io('/chat', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on('connect', () => { socket.emit('auth', { userId }); setConnected(true); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('message', (data: ChatMessage) => setIncoming(data));
    socket.on('alert', (data: { text: string }) => setIncoming({ text: data.text }));

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [userId, enabled]);

  const sendMessage = useCallback((text: string) => { socketRef.current?.emit('message', { text }); }, []);
  const sendCallback = useCallback((callbackData: string) => { socketRef.current?.emit('callback', { callbackData }); }, []);

  return { connected, incoming, sendMessage, sendCallback };
}
