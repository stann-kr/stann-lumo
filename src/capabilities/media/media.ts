export interface GalleryPhoto {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  caption: string;
  sortOrder: number;
  createdAt: string;
  mediaType: 'image' | 'video_file' | 'video_youtube';
  focalX: number;
  focalY: number;
  videoYoutubeId?: string;
  videoThumbnailUrl?: string;
  linkedEventId?: string;
  eventDate?: string;
}

export interface GallerySettings {
  layoutMode: 'masonry' | 'grid';
  columnsMobile: 1 | 2;
  columnsTablet: 2 | 3;
  columnsDesktop: 2 | 3 | 4 | 5;
  gapSize: 'sm' | 'md' | 'lg';
  aspectRatio: 'auto' | '1:1' | '4:3' | '3:4' | '16:9';
  hoverEffect: 'zoom' | 'fade' | 'none';
  captionDisplay: 'overlay' | 'below' | 'hidden';
  lightboxEnabled: boolean;
}

export interface GalleryData {
  photos: GalleryPhoto[];
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Flyer captions often already end with the event date; avoid printing it twice. */
export function captionIncludesDate(caption: string, date?: string): boolean {
  if (!date) return false;
  const normalize = (value: string) => value.replace(/[./]/g, '-');
  return normalize(caption).includes(normalize(date));
}

// Bypass incomplete image responses retained under the original immutable URLs.
export function getPublicImageUrl(id: string): string {
  return `/api/media/${encodeURIComponent(id)}?v=2`;
}
