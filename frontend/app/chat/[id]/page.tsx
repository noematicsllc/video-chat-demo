import { redirect } from 'next/navigation';
import { createChatToken } from '@/lib/auth';
import { fetchMessages, type Message } from '@/lib/db';
import { getCurrentUserId } from '@/lib/server-auth';
import type { ChatMessage } from '@/lib/chat';
import ChatRoomClient from './client';
import { v5 as uuidv5 } from 'uuid';

const USER_ID_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
const CHAT_WS_URL = process.env.CHAT_WS_URL || 'ws://localhost:4000/socket';

/**
 * Convert a user ID to UUID format.
 * If the user ID is already a valid UUID, returns it as-is.
 * Otherwise, generates a deterministic UUID v5 from the user ID.
 */
function userIdToUUID(userId: string): string {
  // Check if it's already a valid UUID format (8-4-4-4-12 hex digits)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(userId)) {
    return userId;
  }
  
  // Generate a deterministic UUID v5 from the user ID
  return uuidv5(userId, USER_ID_NAMESPACE);
}

/**
 * Chat page server component.
 * 
 * This server component:
 * 1. Gets the current user from the session
 * 2. Generates a JWT token for the Elixir chat server
 * 3. Fetches message history from the database
 * 4. Passes data to the client component
 */
export default async function ChatPage({ params }: { params: { id: string } }) {
  // 1. Get Current User (from your Zitadel session)
  const rawUserId = await getCurrentUserId();
  
  if (!rawUserId) {
    redirect('/');
  }

  // Convert user ID to UUID format (chat server expects UUID)
  const userId = userIdToUUID(rawUserId);

  // 2. Mint the Token for Elixir
  // This generates the string "eyJ..." signed with the shared secret
  const chatToken = createChatToken(userId);

  // 3. Fetch History (Optional but recommended)
  // Fetch the last 50 messages from Postgres directly here on the server
  // This is faster than asking the socket to do it.
  let initialMessages: Message[] = [];
  try {
    initialMessages = await fetchMessages(params.id, 50);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    // Continue without initial messages if database is not configured
  }

  // Convert Message[] to ChatMessage[] format for the client component
  const chatMessages: ChatMessage[] = initialMessages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    sender_id: msg.sender_id,
    inserted_at: msg.inserted_at.toISOString(),
  }));

  return (
    <ChatRoomClient 
      conversationId={params.id}
      token={chatToken}
      initialMessages={chatMessages}
      currentUserId={userId}
      wsUrl={CHAT_WS_URL}
    />
  );
}

