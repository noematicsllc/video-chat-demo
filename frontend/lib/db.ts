/** Database client interface for shared Postgres database. */

import { Pool, QueryResult } from 'pg';
import { randomUUID } from 'crypto';

/**
 * Database connection pool.
 * Uses DATABASE_URL environment variable for connection.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Database schema (matches Elixir/Phoenix chat server):
 * - conversations table (id UUID, type VARCHAR, inserted_at TIMESTAMP, updated_at TIMESTAMP)
 * - conversation_members table (conversation_id UUID, user_id UUID, joined_at TIMESTAMP)
 * - messages table (id UUID, conversation_id UUID, sender_id UUID, content JSONB, inserted_at TIMESTAMP)
 */

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  inserted_at: Date;
  updated_at: Date;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  joined_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: { text: string };
  inserted_at: Date;
}

/**
 * Find existing direct conversation between two users.
 * 
 * SQL query:
 * SELECT c.id FROM conversations c
 * JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = $1
 * JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = $2
 * WHERE c.type = 'direct'
 *   AND (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) = 2
 * LIMIT 1
 */
export async function findExistingDirectChat(
  currentUserId: string,
  targetUserId: string
): Promise<string | null> {
  const query = `
    SELECT c.id 
    FROM conversations c
    INNER JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = $1
    INNER JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = $2
    WHERE c.type = 'direct'
      AND (
        SELECT COUNT(*) 
        FROM conversation_members 
        WHERE conversation_id = c.id
      ) = 2
    LIMIT 1
  `;

  try {
    const result: QueryResult<{ id: string }> = await pool.query(query, [currentUserId, targetUserId]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('Error finding existing direct chat:', error);
    throw new Error(`Failed to find existing direct chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new conversation.
 * 
 * SQL query:
 * INSERT INTO conversations (id, type, inserted_at, updated_at)
 * VALUES ($1, $2, NOW(), NOW())
 * RETURNING id, type, inserted_at, updated_at
 */
export async function createConversation(type: 'direct' | 'group'): Promise<Conversation> {
  const id = randomUUID();
  const query = `
    INSERT INTO conversations (id, type, inserted_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    RETURNING id, type, inserted_at, updated_at
  `;

  try {
    const result: QueryResult<Conversation> = await pool.query(query, [id, type]);
    if (result.rows.length === 0) {
      throw new Error('Failed to create conversation');
    }
    return {
      id: result.rows[0].id,
      type: result.rows[0].type as 'direct' | 'group',
      inserted_at: result.rows[0].inserted_at,
      updated_at: result.rows[0].updated_at,
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add members to a conversation.
 * 
 * SQL query:
 * INSERT INTO conversation_members (conversation_id, user_id, joined_at)
 * VALUES ($1, $2, NOW()), ($1, $3, NOW()), ...
 * ON CONFLICT DO NOTHING (if unique constraint exists)
 */
export async function addConversationMembers(
  conversationId: string,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  // Build the query with multiple value tuples
  const values: string[] = [];
  const params: string[] = [];
  
  userIds.forEach((userId, index) => {
    const paramIndex = index + 2; // Start from $2 (since $1 is conversationId)
    values.push(`($1, $${paramIndex}, NOW())`);
    params.push(userId);
  });

  const query = `
    INSERT INTO conversation_members (conversation_id, user_id, joined_at)
    VALUES ${values.join(', ')}
    ON CONFLICT (conversation_id, user_id) DO NOTHING
  `;

  try {
    await pool.query(query, [conversationId, ...params]);
  } catch (error) {
    console.error('Error adding conversation members:', error);
    throw new Error(`Failed to add conversation members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch messages from a conversation.
 * 
 * SQL query:
 * SELECT id, conversation_id, sender_id, content, inserted_at
 * FROM messages
 * WHERE conversation_id = $1
 * ORDER BY inserted_at ASC
 * LIMIT $2
 */
export async function fetchMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const query = `
    SELECT id, conversation_id, sender_id, content, inserted_at
    FROM messages
    WHERE conversation_id = $1
    ORDER BY inserted_at ASC
    LIMIT $2
  `;

  try {
    const result: QueryResult<{
      id: string;
      conversation_id: string;
      sender_id: string;
      content: { text: string } | string;
      inserted_at: Date;
    }> = await pool.query(query, [conversationId, limit]);

    return result.rows.map((row) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      inserted_at: row.inserted_at,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
