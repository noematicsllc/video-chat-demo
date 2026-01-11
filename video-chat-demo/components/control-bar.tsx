"use client"

import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ControlBarProps {
  onLeave: () => void
}

export function ControlBar({ onLeave }: ControlBarProps) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()

  const isMicEnabled = localParticipant.isMicrophoneEnabled
  const isCameraEnabled = localParticipant.isCameraEnabled
  const isScreenShareEnabled = localParticipant.isScreenShareEnabled

  const toggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicEnabled)
  }

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled)
  }

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
  }

  const handleLeave = () => {
    room.disconnect()
    onLeave()
  }

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-4 bg-card border-t border-border">
      <div className="flex items-center gap-2">
        <Button
          variant={isMicEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleMicrophone}
          className={cn("rounded-full h-12 w-12", isMicEnabled && "bg-secondary hover:bg-secondary/80")}
        >
          {isMicEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isCameraEnabled ? "secondary" : "destructive"}
          size="lg"
          onClick={toggleCamera}
          className={cn("rounded-full h-12 w-12", isCameraEnabled && "bg-secondary hover:bg-secondary/80")}
        >
          {isCameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isScreenShareEnabled ? "default" : "secondary"}
          size="lg"
          onClick={toggleScreenShare}
          className={cn("rounded-full h-12 w-12", isScreenShareEnabled && "bg-primary hover:bg-primary/90")}
        >
          {isScreenShareEnabled ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <div className="w-px h-8 bg-border mx-2" />

        <Button variant="destructive" size="lg" onClick={handleLeave} className="rounded-full h-12 px-6">
          <PhoneOff className="h-5 w-5 mr-2" />
          Leave
        </Button>
      </div>
    </div>
  )
}
