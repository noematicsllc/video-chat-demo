"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Users } from "lucide-react"

interface JoinFormProps {
  onJoin: (details: {
    serverUrl: string
    token: string
    roomName: string
    participantName: string
  }) => void
}

export function JoinForm({ onJoin }: JoinFormProps) {
  const [serverUrl, setServerUrl] = useState("")
  const [token, setToken] = useState("")
  const [roomName, setRoomName] = useState("")
  const [participantName, setParticipantName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (serverUrl && token && roomName && participantName) {
      onJoin({ serverUrl, token, roomName, participantName })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Join Video Chat</CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect to your LiveKit server to start video conferencing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl" className="text-foreground">
                Server URL
              </Label>
              <Input
                id="serverUrl"
                type="url"
                placeholder="wss://your-livekit-server.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token" className="text-foreground">
                Access Token
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="Your JWT access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participantName" className="text-foreground">
                Your Name
              </Label>
              <Input
                id="participantName"
                type="text"
                placeholder="John Doe"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                required
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!serverUrl || !token || !roomName || !participantName}
            >
              <Users className="mr-2 h-4 w-4" />
              Join Room
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
