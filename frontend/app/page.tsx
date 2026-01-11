"use client"

import { useState } from "react"
import { JoinForm } from "@/components/join-form"
import { VideoRoom } from "@/components/video-room"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading, isAuthenticated, login } = useAuth()
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string
    token: string
    roomName: string
    participantName: string
  } | null>(null)

  const handleJoin = (details: {
    serverUrl: string
    token: string
    roomName: string
    participantName: string
  }) => {
    setConnectionDetails(details)
  }

  const handleLeave = () => {
    setConnectionDetails(null)
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  // If already in a room, show the video room
  if (connectionDetails) {
    return (
      <main className="min-h-screen bg-background">
        <VideoRoom
          serverUrl={connectionDetails.serverUrl}
          token={connectionDetails.token}
          roomName={connectionDetails.roomName}
          participantName={connectionDetails.participantName}
          onLeave={handleLeave}
        />
      </main>
    )
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Video Chat
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Please log in to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={login}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Login with Zitadel
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Show join form for authenticated users
  return (
    <main className="min-h-screen bg-background">
      <JoinForm onJoin={handleJoin} user={user} />
    </main>
  )
}
