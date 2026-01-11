"use client"

import type { Participant, LocalParticipant } from "livekit-client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"

interface ParticipantListProps {
  participants: Participant[]
  localParticipant: LocalParticipant | undefined
}

export function ParticipantList({ participants, localParticipant }: ParticipantListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {participants.map((participant) => (
          <ParticipantItem
            key={participant.sid}
            participant={participant}
            isLocal={participant.sid === localParticipant?.sid}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface ParticipantItemProps {
  participant: Participant
  isLocal: boolean
}

function ParticipantItem({ participant, isLocal }: ParticipantItemProps) {
  const isMicEnabled = participant.isMicrophoneEnabled
  const isCameraEnabled = participant.isCameraEnabled

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary">
          {participant.name?.[0]?.toUpperCase() || participant.identity?.[0]?.toUpperCase() || "?"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {participant.name || participant.identity}
          </span>
          {isLocal && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">You</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isMicEnabled ? (
          <Mic className="h-4 w-4 text-muted-foreground" />
        ) : (
          <MicOff className="h-4 w-4 text-destructive" />
        )}
        {isCameraEnabled ? (
          <Video className="h-4 w-4 text-muted-foreground" />
        ) : (
          <VideoOff className="h-4 w-4 text-destructive" />
        )}
      </div>
    </div>
  )
}
