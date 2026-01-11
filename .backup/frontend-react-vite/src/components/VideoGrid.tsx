/** Video grid component for displaying participant videos. */

import { useEffect, useRef, useState } from 'react';
import { Room, Participant, Track, VideoTrack, RoomEvent } from 'livekit-client';

interface VideoGridProps {
  room: Room | null;
  participants: Participant[];
}

export function VideoGrid({ room, participants }: VideoGridProps) {
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | null>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Map<string, VideoTrack>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room) return;

    // Get local video track
    const localVideoPublications = Array.from(
      room.localParticipant.videoTrackPublications.values()
    );
    const localVideoPub = localVideoPublications.find((pub) => pub.isSubscribed);
    if (localVideoPub?.track) {
      const track = localVideoPub.track as VideoTrack;
      setLocalVideoTrack(track);
      if (localVideoRef.current) {
        track.attach(localVideoRef.current);
      }
    }

    // Update remote video tracks
    const tracks = new Map<string, VideoTrack>();
    participants.forEach((participant) => {
      const videoPublications = Array.from(participant.videoTrackPublications.values());
      const videoPub = videoPublications.find((pub) => pub.isSubscribed);
      if (videoPub?.track) {
        tracks.set(participant.identity, videoPub.track as VideoTrack);
      }
    });
    setRemoteVideoTracks(tracks);

    // Set up event listeners
    const handleTrackSubscribed = (
      track: Track,
      _publication: any,
      participant: Participant
    ) => {
      if (track.kind === 'video') {
        setRemoteVideoTracks((prev) => {
          const newTracks = new Map(prev);
          newTracks.set(participant.identity, track as VideoTrack);
          return newTracks;
        });
      }
    };

    const handleTrackUnsubscribed = (
      track: Track,
      _publication: any,
      participant: Participant
    ) => {
      if (track.kind === 'video') {
        setRemoteVideoTracks((prev) => {
          const newTracks = new Map(prev);
          newTracks.delete(participant.identity);
          return newTracks;
        });
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    };
  }, [room, participants]);

  const allParticipants = localVideoTrack
    ? [{ identity: 'local', videoTrack: localVideoTrack }, ...Array.from(remoteVideoTracks.entries()).map(([identity, track]) => ({ identity, videoTrack: track }))]
    : Array.from(remoteVideoTracks.entries()).map(([identity, track]) => ({ identity, videoTrack: track }));

  if (allParticipants.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#666'
      }}>
        No video tracks available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: allParticipants.length === 1
          ? '1fr'
          : allParticipants.length <= 4
          ? 'repeat(2, 1fr)'
          : 'repeat(3, 1fr)',
        gap: '10px',
        padding: '20px',
        height: '100%',
        overflow: 'auto'
      }}
    >
      {allParticipants.map(({ identity, videoTrack }) => (
        <VideoTile
          key={identity}
          track={videoTrack}
          participantId={identity}
          isLocal={identity === 'local'}
        />
      ))}
    </div>
  );
}

interface VideoTileProps {
  track: VideoTrack;
  participantId: string;
  isLocal: boolean;
}

function VideoTile({ track, participantId, isLocal }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && track) {
      track.attach(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        track.detach(videoRef.current);
      }
    };
  }, [track]);

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      aspectRatio: '16/9'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        {isLocal ? 'You' : participantId}
      </div>
    </div>
  );
}

