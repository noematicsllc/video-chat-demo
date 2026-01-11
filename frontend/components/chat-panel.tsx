"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  isLocal: boolean
}

interface ChatPanelProps {
  participantName: string
  onClose: () => void
}

export function ChatPanel({ participantName, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!inputValue.trim()) return

      const newMessage: Message = {
        id: Date.now().toString(),
        sender: participantName,
        content: inputValue.trim(),
        timestamp: new Date(),
        isLocal: true,
      }

      setMessages((prev) => [...prev, newMessage])
      setInputValue("")

      // Here you would integrate with your existing chat server
      // For example: sendMessageToServer(newMessage)
    },
    [inputValue, participantName],
  )

  // Expose a method to receive messages from your chat server
  const receiveMessage = useCallback((sender: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender,
      content,
      timestamp: new Date(),
      isLocal: false,
    }
    setMessages((prev) => [...prev, newMessage])
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-medium text-foreground">Chat</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
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
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={cn("flex flex-col gap-1", message.isLocal && "items-end")}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{message.isLocal ? "You" : message.sender}</span>
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
