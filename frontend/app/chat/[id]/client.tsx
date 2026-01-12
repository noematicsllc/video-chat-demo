'use client';

import { ChatPanel } from '@/components/chat-panel';
import type { ChatMessage } from '@/lib/chat';

interface ChatRoomClientProps {
  conversationId: string;
  token: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  wsUrl: string;
}

/**
 * Client component for the chat room.
 * 
 * This component receives the token and initial messages from the server component
 * and initializes the WebSocket connection using the useChat hook.
 */
export default function ChatRoomClient({
  conversationId,
  token,
  initialMessages,
  currentUserId,
  wsUrl,
}: ChatRoomClientProps) {
  // For now, we'll use the ChatPanel component which handles the chat UI
  // You may want to create a dedicated chat room layout here
  return (
    <div className="h-screen flex flex-col">
      <ChatPanel
        chatToken={token}
        conversationId={conversationId}
        wsUrl={wsUrl}
        currentUserId={currentUserId}
        participantName="Chat"
        onClose={() => window.history.back()}
      />
    </div>
  );
}

