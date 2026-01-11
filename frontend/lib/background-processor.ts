/** Background processor utilities for LiveKit video tracks. */

import { LocalVideoTrack, Room } from 'livekit-client';
import { BackgroundBlur, VirtualBackground, supportsBackgroundProcessors } from '@livekit/track-processors';
import type { BackgroundMode, BackgroundOption } from './backgrounds';

/**
 * Check if background processing is supported in the current browser.
 */
export function isBackgroundProcessingSupported(): boolean {
  return supportsBackgroundProcessors();
}

/**
 * Get the local video track from the room.
 */
export function getLocalVideoTrack(room: Room | null): LocalVideoTrack | null {
  if (!room) return null;

  // videoTrackPublications is a Map, iterate through values
  for (const pub of room.localParticipant.videoTrackPublications.values()) {
    if (pub.source === 'camera' && pub.track) {
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
  options: { blurRadius?: number; backgroundImageUrl?: string } = {}
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
      const blurRadius = options.blurRadius || 20;
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

