import type { Metadata } from 'next';

export const SITE_URL = new URL('https://lumo.stann.kr');
const SITE_NAME = 'STANN LUMO';

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
  const images = image ? [{ url: image.url, ...(image.alt && { alt: image.alt }) }] : undefined;

  return {
    metadataBase: SITE_URL,
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      url,
      ...(images && { images }),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: shareTitle,
      description,
      ...(images && { images }),
    },
  };
}
