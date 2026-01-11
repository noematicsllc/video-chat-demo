/** Phoenix chat client utilities. */

import { Socket, Channel } from 'phoenix';

export interface ChatMessage {
  id: string;
  content: { text: string };
  sender_id: string;
  inserted_at: string;
}

export interface PresenceState {
  [userId: string]: {
    metas: Array<{
      phx_ref: string;
      online_at: string;
    }>;
  };
}

export interface PresenceDiff {
  joins?: PresenceState;
  leaves?: PresenceState;
}

export interface ChatClientCallbacks {
  onPresenceState?: (state: PresenceState) => void;
  onPresenceDiff?: (diff: PresenceDiff) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

/**
 * Chat client wrapper for Phoenix Socket.
 */
export class ChatClient {
  private socket: Socket;
  private channels: Map<string, Channel>;
  private callbacks: ChatClientCallbacks;

  constructor(token: string, wsUrl: string, callbacks: ChatClientCallbacks = {}) {
    this.channels = new Map();
    this.callbacks = callbacks;

    // Create socket with authentication token
    this.socket = new Socket(wsUrl, {
      params: { token },
      logger: (kind, msg, data) => {
        console.log(`${kind}: ${msg}`, data);
      },
    });

    this.socket.connect();
  }

  /**
   * Join a conversation channel.
   * @param conversationId - UUID of the conversation
   * @returns Promise that resolves to the channel
   */
  async joinConversation(conversationId: string): Promise<Channel> {
    return new Promise((resolve, reject) => {
      const topic = `chat:${conversationId}`;

      // Check if already joined
      if (this.channels.has(topic)) {
        const existingChannel = this.channels.get(topic);
        if (existingChannel) {
          resolve(existingChannel);
          return;
        }
      }

      const channel = this.socket.channel(topic, {});

      // Handle presence events
      channel.on('presence_state', (state: PresenceState) => {
        console.log('Presence state:', state);
        if (this.callbacks.onPresenceState) {
          this.callbacks.onPresenceState(state);
        }
      });

      channel.on('presence_diff', (diff: PresenceDiff) => {
        console.log('Presence diff:', diff);
        if (this.callbacks.onPresenceDiff) {
          this.callbacks.onPresenceDiff(diff);
        }
      });

      // Handle new messages
      channel.on('new_msg', (payload: ChatMessage) => {
        console.log('New message:', payload);
        if (this.callbacks.onNewMessage) {
          this.callbacks.onNewMessage(payload);
        }
      });

      // Join the channel
      channel
        .join()
        .receive('ok', (resp) => {
          console.log('Joined conversation:', resp);
          this.channels.set(topic, channel);
          resolve(channel);
        })
        .receive('error', (resp) => {
          console.error('Failed to join:', resp);
          const error = new Error(`Failed to join conversation: ${JSON.stringify(resp)}`);
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
          reject(error);
        })
        .receive('timeout', () => {
          console.error('Join timeout');
          const error = new Error('Join timeout');
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
          reject(error);
        });
    });
  }

  /**
   * Send a message to the conversation.
   * @param conversationId - UUID of the conversation
   * @param messageBody - The message text
   * @returns Promise that resolves when message is sent
   */
  async sendMessage(conversationId: string, messageBody: string): Promise<void> {
    const topic = `chat:${conversationId}`;
    const channel = this.channels.get(topic);

    if (!channel) {
      throw new Error(`Not joined to conversation: ${conversationId}`);
    }

    return new Promise((resolve, reject) => {
      channel
        .push('new_msg', { body: messageBody })
        .receive('ok', (resp) => {
          console.log('Message sent:', resp);
          resolve();
        })
        .receive('error', (resp) => {
          console.error('Failed to send message:', resp);
          reject(new Error(`Failed to send message: ${JSON.stringify(resp)}`));
        })
        .receive('timeout', () => {
          console.error('Send timeout');
          reject(new Error('Send timeout'));
        });
    });
  }

  /**
   * Leave a conversation.
   * @param conversationId - UUID of the conversation
   */
  leaveConversation(conversationId: string): void {
    const topic = `chat:${conversationId}`;
    const channel = this.channels.get(topic);

    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  /**
   * Ping the server.
   * @param conversationId - UUID of the conversation
   * @param payload - Optional payload
   * @returns Promise that resolves with the response
   */
  async ping(conversationId: string, payload: Record<string, unknown> = {}): Promise<unknown> {
    const topic = `chat:${conversationId}`;
    const channel = this.channels.get(topic);

    if (!channel) {
      throw new Error(`Not joined to conversation: ${conversationId}`);
    }

    return new Promise((resolve, reject) => {
      channel
        .push('ping', payload)
        .receive('ok', (resp) => {
          resolve(resp);
        })
        .receive('error', (resp) => {
          reject(new Error(`Ping failed: ${JSON.stringify(resp)}`));
        });
    });
  }

  /**
   * Disconnect from the socket and leave all channels.
   */
  disconnect(): void {
    // Leave all channels
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.socket.disconnect();
  }

  /**
   * Check if the socket is connected.
   */
  isConnected(): boolean {
    return this.socket.isConnected();
  }
}

