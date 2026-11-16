import type { Metadata } from 'next';

export const SITE_URL = new URL('https://lumo.stann.kr');
const SITE_NAME = 'STANN LUMO';
/** 1200×630 card (photo, wordmark, Resident · Faust Seoul) for routes without their own image, so shared links never
    arrive as a bare text preview. */
export const DEFAULT_SHARE_IMAGE = { url: '/og.jpg', width: 1200, height: 630, alt: 'STANN LUMO — DJ · Producer, Seoul' };

export interface PublicMetadataInput {
  title: string;
  description: string;
  path: string;
  /** Share preview image; relative paths resolve against the public site. */
  image?: { url: string; alt?: string };
}

/** Builds route-specific discoverability metadata without exposing admin data. */
export function createPublicMetadata({ title, description, path, image }: PublicMetadataInput): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const shareTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  const images = image ? [{ url: image.url, ...(image.alt && { alt: image.alt }) }] : [DEFAULT_SHARE_IMAGE];

  return {
    metadataBase: SITE_URL,
    // The public layout's '%s | STANN LUMO' template would double the home title; absolute skips it.
    title: title === SITE_NAME ? { absolute: SITE_NAME } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      url,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images,
    },
  };
}
