/** Background options for video tracks. */

export type BackgroundMode = 'none' | 'blur' | 'custom';

export interface BackgroundOption {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'office',
    name: 'Office',
    imageUrl: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1920&h=1080&fit=crop',
  },
  {
    id: 'nature',
    name: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop',
  },
  {
    id: 'space',
    name: 'Space',
    imageUrl: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=1080&fit=crop',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&h=1080&fit=crop',
  },
];

export function getBackgroundById(id: string): BackgroundOption | undefined {
  return BACKGROUND_OPTIONS.find((bg) => bg.id === id);
}

