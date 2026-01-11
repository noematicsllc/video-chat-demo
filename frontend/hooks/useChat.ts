/** React hook for managing chat conversation. */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ChatClient, type ChatMessage, type PresenceState, type PresenceDiff } from '@/lib/chat';

interface UseChatOptions {
  token: string | null;
  conversationId: string;
  wsUrl: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  presence: PresenceState;
  isConnected: boolean;
  error: Error | null;
  sendMessage: (messageBody: string) => Promise<void>;
}

/**
 * React hook for managing chat conversation.
 * @param token - Chat JWT token
 * @param conversationId - UUID of the conversation
 * @param wsUrl - WebSocket URL for the chat server
 * @returns Chat state and methods
 */
export function useChat({ token, conversationId, wsUrl }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presence, setPresence] = useState<PresenceState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<ChatClient | null>(null);

  useEffect(() => {
    if (!token || !conversationId) {
      setIsConnected(false);
      setError(null);
      return;
    }

    const chatClient = new ChatClient(token, wsUrl, {
      onNewMessage: (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      },
      onPresenceState: (state: PresenceState) => {
        setPresence(state);
      },
      onPresenceDiff: (diff: PresenceDiff) => {
        // Merge presence updates
        setPresence((prev) => {
          const updated = { ...prev };

          // Handle joins
          if (diff.joins) {
            Object.assign(updated, diff.joins);
          }

          // Handle leaves
          if (diff.leaves) {
            Object.keys(diff.leaves).forEach((userId) => {
              delete updated[userId];
            });
          }

          return updated;
        });
      },
      onError: (err: Error) => {
        setError(err);
        setIsConnected(false);
      },
    });

    clientRef.current = chatClient;

    chatClient
      .joinConversation(conversationId)
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsConnected(false);
      });

    return () => {
      chatClient.leaveConversation(conversationId);
      chatClient.disconnect();
      clientRef.current = null;
    };
  }, [token, conversationId, wsUrl]);

  const sendMessage = useCallback(
    async (messageBody: string) => {
      const client = clientRef.current;
      if (!client) {
        throw new Error('Not connected');
      }
      return client.sendMessage(conversationId, messageBody);
    },
    [conversationId]
  );

  return {
    messages,
    presence,
    isConnected,
    error,
    sendMessage,
  };
}

