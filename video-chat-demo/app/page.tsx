"use client"

import { useState } from "react"
import { JoinForm } from "@/components/join-form"
import { VideoRoom } from "@/components/video-room"

export default function Home() {
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

  return (
    <main className="min-h-screen bg-background">
      {connectionDetails ? (
        <VideoRoom
          serverUrl={connectionDetails.serverUrl}
          token={connectionDetails.token}
          roomName={connectionDetails.roomName}
          participantName={connectionDetails.participantName}
          onLeave={handleLeave}
        />
      ) : (
        <JoinForm onJoin={handleJoin} />
      )}
    </main>
  )
}
