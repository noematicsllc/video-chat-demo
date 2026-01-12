'use server';

import { redirect } from 'next/navigation';
import { 
  findExistingDirectChat, 
  createConversation, 
  addConversationMembers 
} from '@/lib/db';

/**
 * Start a direct chat conversation between two users.
 * 
 * This server action:
 * 1. Checks if a direct conversation already exists between the two users
 * 2. Creates a new conversation if one doesn't exist
 * 3. Adds both users as members of the conversation
 * 4. Redirects to the chat page
 * 
 * @param currentUserId - The ID of the current user
 * @param targetUserId - The ID of the user to start a chat with
 */
export async function startDirectChat(currentUserId: string, targetUserId: string) {
  // 1. "Get or Create" Logic (The Brain)
  // Check if a direct conversation already exists between these two IDs.
  // (In SQL: SELECT c.id FROM conversations c JOIN members m1... JOIN members m2...)
  
  let conversationId = await findExistingDirectChat(currentUserId, targetUserId);

  if (!conversationId) {
    // 2. Create the Conversation Row
    const newChat = await createConversation('direct');
    conversationId = newChat.id;

    // 3. Add Members (The Shared Schema)
    await addConversationMembers(conversationId, [currentUserId, targetUserId]);
  }

  // 4. Redirect user to the chat page
  redirect(`/chat/${conversationId}`);
}

