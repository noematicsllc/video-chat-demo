"use client"

import { useState, useEffect, useCallback } from "react"
import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLocalVideoTrack, applyBackgroundProcessor, isBackgroundProcessingSupported } from "@/lib/background-processor"
import { BACKGROUND_OPTIONS, type BackgroundMode, type BackgroundOption } from "@/lib/backgrounds"

interface ControlBarProps {
  onLeave: () => void
}

export function ControlBar({ onLeave }: ControlBarProps) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("none")
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(null)
  const [isBackgroundMenuOpen, setIsBackgroundMenuOpen] = useState(false)

  const isMicEnabled = localParticipant.isMicrophoneEnabled
  const isCameraEnabled = localParticipant.isCameraEnabled
  const isScreenShareEnabled = localParticipant.isScreenShareEnabled
  const isBackgroundSupported = isBackgroundProcessingSupported()

  const handleBackgroundModeChange = useCallback(
    async (mode: BackgroundMode, background?: BackgroundOption | null) => {
      if (!isCameraEnabled) return

      try {
        let track = getLocalVideoTrack(room)
        if (!track) {
          // Wait a bit and try again
          await new Promise((resolve) => setTimeout(resolve, 200))
          track = getLocalVideoTrack(room)
        }

        if (!track) {
          console.warn("No local video track available")
          return
        }

        const options: { blurRadius?: number; backgroundImageUrl?: string } = {}

        if (mode === "blur") {
          options.blurRadius = 20
        } else if (mode === "custom" && background) {
          options.backgroundImageUrl = background.imageUrl
        }

        await applyBackgroundProcessor(track, mode, options)

        setBackgroundMode(mode)
        if (mode === "custom") {
          setSelectedBackground(background || null)
        } else {
          setSelectedBackground(null)
        }
        setIsBackgroundMenuOpen(false)
      } catch (error) {
        console.error("Failed to change background mode:", error)
      }
    },
    [room, isCameraEnabled]
  )

  const handleBackgroundSelect = useCallback(
    async (background: BackgroundOption) => {
      await handleBackgroundModeChange("custom", background)
    },
    [handleBackgroundModeChange]
  )

  // Reapply background when camera is toggled on
  useEffect(() => {
    if (isCameraEnabled && backgroundMode !== "none") {
      const timer = setTimeout(() => {
        handleBackgroundModeChange(backgroundMode, selectedBackground)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isCameraEnabled, backgroundMode, selectedBackground, handleBackgroundModeChange])

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

        {isCameraEnabled && (
          <Popover open={isBackgroundMenuOpen} onOpenChange={setIsBackgroundMenuOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={backgroundMode !== "none" ? "default" : "secondary"}
                size="lg"
                disabled={!isBackgroundSupported}
                className={cn("rounded-full h-12 w-12", backgroundMode !== "none" && "bg-primary hover:bg-primary/90")}
                title={!isBackgroundSupported ? "Background blur is not supported in this browser" : "Background options"}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="center">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Background</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      handleBackgroundModeChange("none")
                    }}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {!isBackgroundSupported ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Background blur is not supported in this browser. Please use Chrome, Edge, or another browser with WebCodecs support.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant={backgroundMode === "blur" ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleBackgroundModeChange("blur")}
                    >
                      Blur Background
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      {BACKGROUND_OPTIONS.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => handleBackgroundSelect(bg)}
                          className={cn(
                            "relative aspect-video rounded-md overflow-hidden border-2 transition-all",
                            backgroundMode === "custom" && selectedBackground?.id === bg.id
                              ? "border-primary ring-2 ring-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <img
                            src={bg.imageUrl}
                            alt={bg.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                            <p className="text-xs text-white text-center">{bg.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

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
