"use client"

import { useState } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import "@livekit/components-styles"
import { ChatPanel } from "@/components/chat-panel"
import { VideoGrid } from "@/components/video-grid"
import { ControlBar } from "@/components/control-bar"
import { ParticipantList } from "@/components/participant-list"
import { MessageSquare, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoRoomProps {
  serverUrl: string
  token: string
  roomName: string
  participantName: string
  onLeave: () => void
}

export function VideoRoom({ serverUrl, token, roomName, participantName, onLeave }: VideoRoomProps) {
  const [showChat, setShowChat] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      onDisconnected={onLeave}
      className="h-screen flex flex-col bg-background"
      data-lk-theme="default"
    >
      <RoomContent
        roomName={roomName}
        participantName={participantName}
        showChat={showChat}
        setShowChat={setShowChat}
        showParticipants={showParticipants}
        setShowParticipants={setShowParticipants}
        onLeave={onLeave}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}

interface RoomContentProps {
  roomName: string
  participantName: string
  showChat: boolean
  setShowChat: (show: boolean) => void
  showParticipants: boolean
  setShowParticipants: (show: boolean) => void
  onLeave: () => void
}

function RoomContent({
  roomName,
  participantName,
  showChat,
  setShowChat,
  showParticipants,
  setShowParticipants,
  onLeave,
}: RoomContentProps) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-lg font-semibold text-foreground">{roomName}</h1>
          <span className="text-sm text-muted-foreground">
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showParticipants ? "default" : "outline"}
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
            className="hidden md:flex"
          >
            <Users className="h-4 w-4 mr-2" />
            Participants
          </Button>
          <Button variant={showChat ? "default" : "outline"} size="sm" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Participants sidebar */}
        {showParticipants && (
          <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-medium text-foreground">Participants</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowParticipants(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ParticipantList participants={participants} localParticipant={localParticipant} />
          </aside>
        )}

        {/* Video grid */}
        <main className={cn("flex-1 p-4 overflow-hidden", showChat && "lg:mr-80")}>
          <VideoGrid tracks={tracks} />
        </main>

        {/* Chat panel */}
        {showChat && (
          <aside className="fixed right-0 top-[57px] bottom-[72px] w-full lg:w-80 flex flex-col bg-card border-l border-border z-10 lg:z-0">
            <ChatPanel participantName={participantName} onClose={() => setShowChat(false)} />
          </aside>
        )}
      </div>

      {/* Control bar */}
      <ControlBar onLeave={onLeave} />
    </div>
  )
}
