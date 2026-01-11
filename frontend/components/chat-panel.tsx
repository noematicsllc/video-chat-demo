"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from "@/hooks/useChat"
import type { ChatMessage } from "@/lib/chat"

interface ChatPanelProps {
  chatToken: string | null
  conversationId: string
  wsUrl: string
  currentUserId: string
  participantName: string
  onClose: () => void
}

interface DisplayMessage {
  id: string
  sender: string
  content: string
  timestamp: Date
  isLocal: boolean
}

export function ChatPanel({ chatToken, conversationId, wsUrl, currentUserId, participantName, onClose }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, presence, isConnected, error, sendMessage } = useChat({
    token: chatToken,
    conversationId,
    wsUrl,
  })

  // Convert ChatMessage format to display format
  const displayMessages: DisplayMessage[] = messages.map((msg) => ({
    id: msg.id,
    sender: msg.sender_id === currentUserId ? "You" : `User ${msg.sender_id.substring(0, 8)}`,
    content: msg.content.text,
    timestamp: new Date(msg.inserted_at),
    isLocal: msg.sender_id === currentUserId,
  }))

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim() || !isConnected) return

      try {
        await sendMessage(inputValue.trim())
        setInputValue("")
      } catch (err) {
        console.error("Failed to send message:", err)
      }
    },
    [inputValue, isConnected, sendMessage],
  )

  const onlineCount = Object.keys(presence).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-foreground">Chat</h2>
          {isConnected && onlineCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {onlineCount} online
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Connection status / Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Connection error: {error.message}</span>
        </div>
      )}

      {!isConnected && !error && (
        <div className="px-4 py-2 bg-muted text-muted-foreground text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || !isConnected}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

function ChatMessageComponent({ message }: { message: DisplayMessage }) {
  return (
    <div className={cn("flex flex-col gap-1", message.isLocal && "items-end")}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{message.sender}</span>
        <span className="text-xs text-muted-foreground/60">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div
        className={cn(
          "max-w-[80%] px-3 py-2 rounded-lg text-sm",
          message.isLocal
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-secondary text-secondary-foreground rounded-bl-none",
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
