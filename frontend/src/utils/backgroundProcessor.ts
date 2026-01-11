/** Utility functions for background processing using LiveKit track processors. */

import { LocalVideoTrack, Room } from 'livekit-client';
import { BackgroundBlur, VirtualBackground, supportsBackgroundProcessors } from '@livekit/track-processors';

export type BackgroundMode = 'none' | 'blur' | 'custom';

export interface BackgroundOptions {
  blurRadius?: number;
  backgroundImageUrl?: string;
}

/**
 * Check if the browser supports background processors.
 */
export function isBackgroundProcessingSupported(): boolean {
  return supportsBackgroundProcessors();
}

/**
 * Get the local video track from the room.
 */
export function getLocalVideoTrack(room: Room | null): LocalVideoTrack | null {
  if (!room) return null;
  
  const videoPublications = Array.from(room.localParticipant.videoTrackPublications.values());
  // Find the publication with a LocalVideoTrack
  for (const pub of videoPublications) {
    if (pub.track && pub.track instanceof LocalVideoTrack) {
      return pub.track as LocalVideoTrack;
    }
  }
  return null;
}

/**
 * Apply background processing to the local video track.
 */
export async function applyBackgroundProcessor(
  track: LocalVideoTrack | null,
  mode: BackgroundMode,
  options: BackgroundOptions = {}
): Promise<void> {
  if (!track) {
    throw new Error('No local video track available');
  }

  // Remove any existing processor first
  try {
    await track.stopProcessor();
  } catch (error) {
    // Ignore errors if no processor is set
    console.debug('No existing processor to stop:', error);
  }

  if (mode === 'none') {
    // Already stopped processor above
    return;
  }

  if (!isBackgroundProcessingSupported()) {
    throw new Error('Background processing is not supported in this browser');
  }

  try {
    if (mode === 'blur') {
      const blurRadius = options.blurRadius || 10;
      const blurProcessor = BackgroundBlur(blurRadius);
      await track.setProcessor(blurProcessor);
    } else if (mode === 'custom' && options.backgroundImageUrl) {
      const virtualBackgroundProcessor = VirtualBackground(options.backgroundImageUrl);
      await track.setProcessor(virtualBackgroundProcessor);
    } else {
      throw new Error(`Invalid background mode: ${mode}`);
    }
  } catch (error) {
    console.error('Failed to apply background processor:', error);
    throw error;
  }
}

