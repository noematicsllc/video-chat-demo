# Nexus Chat Server - Public API Documentation

## Overview

Nexus Chat Server is a real-time WebSocket-based chat microservice built with Phoenix (Elixir). It provides secure, authenticated real-time messaging with support for direct conversations, presence tracking, and message persistence.

## Base URL

```
ws://localhost:4000/socket
```

For production, use:
```
wss://your-domain.com/socket
```

## Authentication

All connections require JWT authentication. The JWT token must be provided during WebSocket connection handshake.

### JWT Token Requirements

- **Algorithm**: HS256
- **Required Claim**: `sub` - The user ID (must be a UUID string)
- **Optional Claim**: `exp` - Token expiration timestamp (Unix timestamp)
- **Secret**: Must match the `JWT_SECRET` environment variable configured in the server

### Token Format

```json
{
  "sub": "user-uuid-here",
  "exp": 1768163851
}
```

## Connection

### WebSocket Connection

Connect to the WebSocket endpoint with the JWT token in the connection parameters:

**Connection URL**: `/socket/websocket`

**Connection Parameters**:
```json
{
  "token": "your-jwt-token-here"
}
```

**Success Response**: Connection established, socket authenticated
**Error Response**: Connection rejected if token is invalid or missing

## Channels

### Channel Topics

Channels are identified by topics in the format:
- Direct conversations: `chat:{conversation_id}`

Where `conversation_id` is a UUID string.

### Joining a Channel

To join a conversation channel, subscribe to the topic:
- Topic: `chat:{conversation_id}`

**Response Events**:
1. `phx_reply` - Join confirmation with `status: "ok"`
2. `presence_state` - Initial presence state for all users in the conversation
3. `presence_diff` - Presence updates when users join/leave

### Example Join Flow

1. Connect to WebSocket with token
2. Subscribe to `chat:{conversation_id}`
3. Receive `presence_state` with current users
4. Your presence is automatically tracked

## Event Protocol

### Client → Server Events

#### `new_msg`

Send a new message to the conversation.

**Payload**:
```json
{
  "body": "Hello, world!"
}
```

**Response**: 
- `phx_reply` with `status: "ok"` on success
- `phx_reply` with `status: "error"` and `payload: {reason: "Failed to save"}` on failure

**Requirements**:
- Must be joined to the channel
- `body` must be a non-empty string

#### `ping`

Ping the server (useful for connection keepalive and latency testing).

**Payload**: Any JSON object

**Response**: `phx_reply` with `status: "ok"` and the same payload echoed back

### Server → Client Events

#### `new_msg`

Broadcast when a new message is created in the conversation.

**Payload**:
```json
{
  "id": "message-uuid",
  "content": {
    "text": "Hello, world!"
  },
  "sender_id": "user-uuid",
  "inserted_at": "2026-01-11T20:05:50.055142Z"
}
```

**Fields**:
- `id` - Message UUID
- `content` - Message content object (currently contains `text` field)
- `sender_id` - UUID of the user who sent the message
- `inserted_at` - ISO 8601 timestamp of when the message was created

#### `presence_state`

Sent immediately after joining a channel, contains the current presence state of all users.

**Payload**:
```json
{
  "user-uuid-1": {
    "metas": [
      {
        "phx_ref": "reference",
        "online_at": "2026-01-11T20:05:50.055142Z"
      }
    ]
  },
  "user-uuid-2": {
    "metas": [...]
  }
}
```

#### `presence_diff`

Sent when users join or leave the channel.

**Payload**:
```json
{
  "joins": {
    "user-uuid": {
      "metas": [
        {
          "phx_ref": "reference",
          "online_at": "2026-01-11T20:05:50.055142Z"
        }
      ]
    }
  },
  "leaves": {
    "user-uuid": {
      "metas": [...]
    }
  }
}
```

## FastAPI Backend Integration

### Generating JWT Tokens

Use the same `JWT_SECRET` that's configured in the Phoenix server.

```python
import jwt
import time
from datetime import datetime, timedelta

JWT_SECRET = "your-shared-secret-key"  # Must match Phoenix JWT_SECRET
JWT_ALGORITHM = "HS256"

def generate_chat_token(user_id: str, expires_in_hours: int = 24) -> str:
    """
    Generate a JWT token for chat server authentication.
    
    Args:
        user_id: The UUID of the user
        expires_in_hours: Token expiration time in hours (default: 24)
    
    Returns:
        JWT token string
    """
    now = datetime.utcnow()
    exp = now + timedelta(hours=expires_in_hours)
    
    payload = {
        "sub": user_id,
        "exp": int(exp.timestamp())
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

# Example usage in FastAPI endpoint
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer

router = APIRouter()
security = HTTPBearer()

@router.get("/chat/token")
async def get_chat_token(current_user_id: str = Depends(get_current_user)):
    """
    Generate a chat token for the authenticated user.
    """
    try:
        token = generate_chat_token(current_user_id)
        return {"token": token, "ws_url": "wss://your-domain.com/socket/websocket"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Using PyJWT Library

```bash
pip install pyjwt[crypto]
```

```python
import jwt

# Generate token
token = jwt.encode(
    {"sub": user_id, "exp": int(time.time()) + 86400},
    JWT_SECRET,
    algorithm="HS256"
)

# Verify token (for testing)
decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
```

## React/JavaScript Client Integration

### Installation

```bash
npm install phoenix
# or
yarn add phoenix
```

### Connection and Channel Setup

```javascript
import { Socket } from "phoenix";

class ChatClient {
  constructor(token, wsUrl = "ws://localhost:4000/socket") {
    // Create socket with authentication token
    this.socket = new Socket(wsUrl, {
      params: { token: token },
      logger: (kind, msg, data) => {
        console.log(`${kind}: ${msg}`, data);
      }
    });

    this.socket.connect();
    this.channels = new Map();
  }

  /**
   * Join a conversation channel
   * @param {string} conversationId - UUID of the conversation
   * @returns {Promise<Channel>}
   */
  async joinConversation(conversationId) {
    return new Promise((resolve, reject) => {
      const topic = `chat:${conversationId}`;
      
      // Check if already joined
      if (this.channels.has(topic)) {
        resolve(this.channels.get(topic));
        return;
      }

      const channel = this.socket.channel(topic, {});

      // Handle presence events
      channel.on("presence_state", (state) => {
        console.log("Presence state:", state);
        // Process presence state
        this.handlePresenceState(state);
      });

      channel.on("presence_diff", (diff) => {
        console.log("Presence diff:", diff);
        // Process presence changes
        this.handlePresenceDiff(diff);
      });

      // Handle new messages
      channel.on("new_msg", (payload) => {
        console.log("New message:", payload);
        this.handleNewMessage(payload);
      });

      // Join the channel
      channel
        .join()
        .receive("ok", (resp) => {
          console.log("Joined conversation:", resp);
          this.channels.set(topic, channel);
          resolve(channel);
        })
        .receive("error", (resp) => {
          console.error("Failed to join:", resp);
          reject(resp);
        })
        .receive("timeout", () => {
          console.error("Join timeout");
          reject(new Error("Join timeout"));
        });
    });
  }

  /**
   * Send a message to the conversation
   * @param {string} conversationId - UUID of the conversation
   * @param {string} messageBody - The message text
   * @returns {Promise}
   */
  async sendMessage(conversationId, messageBody) {
    const topic = `chat:${conversationId}`;
    const channel = this.channels.get(topic);

    if (!channel) {
      throw new Error(`Not joined to conversation: ${conversationId}`);
    }

    return new Promise((resolve, reject) => {
      channel
        .push("new_msg", { body: messageBody })
        .receive("ok", (resp) => {
          console.log("Message sent:", resp);
          resolve(resp);
        })
        .receive("error", (resp) => {
          console.error("Failed to send message:", resp);
          reject(resp);
        })
        .receive("timeout", () => {
          console.error("Send timeout");
          reject(new Error("Send timeout"));
        });
    });
  }

  /**
   * Leave a conversation
   * @param {string} conversationId - UUID of the conversation
   */
  leaveConversation(conversationId) {
    const topic = `chat:${conversationId}`;
    const channel = this.channels.get(topic);

    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  /**
   * Ping the server
   * @param {string} conversationId - UUID of the conversation
   * @param {object} payload - Optional payload
   */
  async ping(conversationId, payload = {}) {
    const topic = `chat:${conversationId}`;
    const channel = this.channels.get(topic);

    if (!channel) {
      throw new Error(`Not joined to conversation: ${conversationId}`);
    }

    return new Promise((resolve, reject) => {
      channel
        .push("ping", payload)
        .receive("ok", (resp) => {
          resolve(resp);
        })
        .receive("error", (resp) => {
          reject(resp);
        });
    });
  }

  // Event handlers (override these in your implementation)
  handlePresenceState(state) {
    // Process initial presence state
  }

  handlePresenceDiff(diff) {
    // Process presence changes (joins/leaves)
  }

  handleNewMessage(message) {
    // Process incoming message
  }

  disconnect() {
    // Leave all channels
    this.channels.forEach((channel) => channel.leave());
    this.channels.clear();
    this.socket.disconnect();
  }
}

export default ChatClient;
```

### React Hook Example

```javascript
import { useEffect, useState, useCallback } from "react";
import ChatClient from "./ChatClient";

function useChatConversation(token, conversationId, wsUrl) {
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !conversationId) return;

    const chatClient = new ChatClient(token, wsUrl);

    // Override handlers
    chatClient.handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    chatClient.handlePresenceState = (state) => {
      setPresence(state);
    };

    chatClient.handlePresenceDiff = (diff) => {
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
    };

    chatClient
      .joinConversation(conversationId)
      .then(() => {
        setIsConnected(true);
        setClient(chatClient);
      })
      .catch((err) => {
        setError(err);
        setIsConnected(false);
      });

    return () => {
      chatClient.leaveConversation(conversationId);
      chatClient.disconnect();
    };
  }, [token, conversationId, wsUrl]);

  const sendMessage = useCallback(
    async (messageBody) => {
      if (!client) {
        throw new Error("Not connected");
      }
      return client.sendMessage(conversationId, messageBody);
    },
    [client, conversationId]
  );

  return {
    messages,
    presence,
    isConnected,
    error,
    sendMessage,
  };
}

// Usage in component
function ChatRoom({ token, conversationId }) {
  const { messages, presence, isConnected, sendMessage, error } =
    useChatConversation(token, conversationId);

  const [messageText, setMessageText] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !isConnected) return;

    try {
      await sendMessage(messageText);
      setMessageText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isConnected) {
    return <div>Connecting...</div>;
  }

  return (
    <div className="chat-room">
      <div className="presence">
        Online: {Object.keys(presence).length} users
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <div className="sender">{msg.sender_id}</div>
            <div className="content">{msg.content.text}</div>
            <div className="timestamp">{msg.inserted_at}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;
```

## Complete Example: FastAPI + React

### FastAPI Backend (Python)

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt
import time
from datetime import datetime, timedelta

app = FastAPI()
security = HTTPBearer()

JWT_SECRET = "your-shared-secret-key"  # Same as Phoenix config
JWT_ALGORITHM = "HS256"
CHAT_WS_URL = "wss://your-domain.com/socket/websocket"

def get_current_user_id(token: str = Depends(security)):
    """Extract user ID from your authentication token"""
    # Your authentication logic here
    # Return user_id (UUID string)
    pass

@app.get("/api/chat/token")
async def get_chat_token(user_id: str = Depends(get_current_user_id)):
    """Generate JWT token for chat server"""
    exp = int(time.time()) + 86400  # 24 hours
    
    payload = {
        "sub": user_id,
        "exp": exp
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": token,
        "ws_url": CHAT_WS_URL,
        "expires_in": 86400
    }

@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Fetch conversation messages from your main API"""
    # Your message fetching logic
    pass
```

### React Frontend (JavaScript)

```javascript
// hooks/useAuth.js
import { useState, useEffect } from "react";
import axios from "axios";

export function useAuth() {
  const [token, setToken] = useState(null);
  const [chatToken, setChatToken] = useState(null);

  useEffect(() => {
    // Fetch chat token from FastAPI backend
    axios
      .get("/api/chat/token", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setChatToken(response.data.token);
      })
      .catch((err) => {
        console.error("Failed to get chat token:", err);
      });
  }, [token]);

  return { chatToken };
}

// components/Chat.jsx
import { useAuth } from "../hooks/useAuth";
import { useChatConversation } from "../hooks/useChatConversation";

function Chat({ conversationId }) {
  const { chatToken } = useAuth();
  const { messages, presence, isConnected, sendMessage } = useChatConversation(
    chatToken,
    conversationId,
    "wss://your-domain.com/socket"
  );

  // Render chat UI
  return (
    <div>
      {/* Chat UI implementation */}
    </div>
  );
}
```

## Error Handling

### Connection Errors

- **Invalid Token**: Connection will be rejected immediately
- **Network Error**: Client should implement reconnection logic
- **Timeout**: Handle join/send timeouts appropriately

### Message Errors

When sending a message fails, the server responds with:
```json
{
  "status": "error",
  "response": {
    "reason": "Failed to save"
  }
}
```

## Best Practices

1. **Token Management**: Generate tokens server-side with appropriate expiration
2. **Reconnection**: Implement automatic reconnection on disconnect
3. **Presence**: Use presence state to show who's online/offline
4. **Message Ordering**: Messages are ordered by `inserted_at` timestamp
5. **Rate Limiting**: Implement client-side rate limiting for message sending
6. **Error Handling**: Always handle errors and provide user feedback

## Security Considerations

1. **JWT Secret**: Keep `JWT_SECRET` secure and never expose it client-side
2. **HTTPS/WSS**: Always use secure connections in production
3. **Token Expiration**: Set reasonable expiration times for tokens
4. **User Validation**: Validate user IDs exist before generating tokens
5. **Message Validation**: Validate message content on client and server

## Limitations

- Maximum message size: Limited by WebSocket frame size (typically 65KB)
- No message history: Fetch message history from your main API, not through WebSocket
- Single conversation per channel: Join multiple channels for multiple conversations
- Presence tracking: Only tracks presence within channels, not global presence

