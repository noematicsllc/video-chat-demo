"use client"

import { useMemo } from "react"
import { type TrackReference, VideoTrack } from "@livekit/components-react"
import { Track } from "livekit-client"
import { cn } from "@/lib/utils"
import { Mic, MicOff, VideoOff, Pin } from "lucide-react"

interface VideoGridProps {
  tracks: TrackReference[]
}

export function VideoGrid({ tracks }: VideoGridProps) {
  const videoTracks = useMemo(() => {
    return tracks.filter((track) => track.source === Track.Source.Camera || track.source === Track.Source.ScreenShare)
  }, [tracks])

  const gridClass = useMemo(() => {
    const count = videoTracks.length
    if (count === 1) return "grid-cols-1"
    if (count === 2) return "grid-cols-1 md:grid-cols-2"
    if (count <= 4) return "grid-cols-2"
    if (count <= 6) return "grid-cols-2 md:grid-cols-3"
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  }, [videoTracks.length])

  if (videoTracks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No video streams available</p>
          <p className="text-sm">Waiting for participants to enable video...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4 h-full auto-rows-fr", gridClass)}>
      {videoTracks.map((trackRef) => (
        <VideoTile key={trackRef.participant.sid + trackRef.source} trackRef={trackRef} />
      ))}
    </div>
  )
}

interface VideoTileProps {
  trackRef: TrackReference
}

function VideoTile({ trackRef }: VideoTileProps) {
  const { participant, publication, source } = trackRef
  const isScreenShare = source === Track.Source.ScreenShare
  const isMuted = !publication?.track?.isMuted === false

  return (
    <div className="relative rounded-lg overflow-hidden bg-secondary aspect-video">
      {publication?.track ? (
        <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-secondary">
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">
                {participant.name?.[0]?.toUpperCase() || participant.identity?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <VideoOff className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isScreenShare && <Pin className="h-4 w-4 text-primary" />}
            <span className="text-sm font-medium text-white truncate">
              {isScreenShare
                ? `${participant.name || participant.identity}'s screen`
                : participant.name || participant.identity}
            </span>
            {participant.isLocal && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">You</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {participant.isMicrophoneEnabled ? (
              <Mic className="h-4 w-4 text-white" />
            ) : (
              <MicOff className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
