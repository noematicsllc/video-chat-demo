/** Conversation ID generation utilities. */

import { v5 as uuidv5 } from 'uuid';

// DNS namespace UUID for deterministic UUID v5 generation
const CHAT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generate a deterministic UUID v5 conversation ID from a room name.
 * This ensures the same room name always maps to the same conversation ID.
 *
 * @param roomName - The video room name
 * @returns A UUID v5 string that can be used as conversation_id
 */
export function roomNameToConversationId(roomName: string): string {
  return uuidv5(roomName, CHAT_NAMESPACE);
}

