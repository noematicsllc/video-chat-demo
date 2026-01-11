/** Predefined background options for virtual backgrounds. */

export interface BackgroundOption {
  id: string;
  name: string;
  thumbnailUrl: string;
  imageUrl: string;
}

/**
 * Predefined background images.
 * Using Unsplash URLs for example backgrounds - in production, you'd want to host your own images.
 */
export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'office',
    name: 'Modern Office',
    thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop'
  },
  {
    id: 'nature',
    name: 'Nature Scene',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop'
  },
  {
    id: 'beach',
    name: 'Beach',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop'
  },
  {
    id: 'city',
    name: 'City Skyline',
    thumbnailUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop'
  },
  {
    id: 'space',
    name: 'Space',
    thumbnailUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200&h=200&fit=crop',
    imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=1080&fit=crop'
  }
];

/**
 * Get background option by ID.
 */
export function getBackgroundById(id: string): BackgroundOption | undefined {
  return BACKGROUND_OPTIONS.find(bg => bg.id === id);
}

