"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Users, Loader2 } from "lucide-react"
import { generateToken } from "@/lib/api"
import type { User } from "@/lib/auth"

interface JoinFormProps {
  onJoin: (details: {
    serverUrl: string
    token: string
    roomName: string
    participantName: string
  }) => void
  user: User | null
}

export function JoinForm({ onJoin, user }: JoinFormProps) {
  const [roomName, setRoomName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const participantName =
    user?.name || user?.preferred_username || "User"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call Next.js API route to generate LiveKit token
      const response = await generateToken({
        room_name: roomName.trim(),
        participant_name: participantName,
      })

      // Pass the response to parent component
      onJoin({
        serverUrl: response.url,
        token: response.token,
        roomName: roomName.trim(),
        participantName,
      })
    } catch (err: any) {
      console.error("Failed to generate token:", err)
      setError(
        err?.message || "Failed to generate token. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Join Video Chat
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter a room name to start video conferencing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {user && (
              <div className="space-y-2">
                <Label className="text-foreground">Your Name</Label>
                <div className="px-3 py-2 rounded-md border border-border bg-muted text-muted-foreground">
                  {participantName}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="roomName" className="text-foreground">
                Room Name
              </Label>
              <Input
                id="roomName"
                type="text"
                placeholder="my-meeting-room"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!roomName.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Join Room
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
