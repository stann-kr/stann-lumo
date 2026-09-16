'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ArtistInfoItem, HomePreviews, HomeSection } from '@/capabilities/content/content';
import { getPublicImageUrl } from '@/capabilities/media/media';
import Link from '../feature/PublicLink';
import styles from './HomePanelPreview.module.css';

interface HomePanelPreviewProps {
  section: HomeSection;
  artistFacts: ArtistInfoItem[];
  previews?: HomePreviews;
}

export function getHomePanelSummary({ section, artistFacts, previews }: HomePanelPreviewProps, isKorean: boolean) {
  if (section.path === '/about') return artistFacts.map((info) => info.value).join(' / ');
  if (section.path === '/music') return previews?.tracks[0]?.title ?? '';
  if (section.path === '/events') {
    const event = previews?.events[0];
    return event ? `${event.date.replace(/\./g, '-')} / ${event.title}`
      : isKorean ? '예정된 공연이 없습니다.' : 'No upcoming events.';
  }
  if (section.path === '/archive') return previews?.photos[0]?.caption || previews?.photos[0]?.altText || section.description;
  return section.description;
}

export default function HomePanelPreview({ section, artistFacts, previews }: HomePanelPreviewProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';

  if (section.path === '/music' && previews?.tracks.length) return <ul className={styles.tracks}>
    {previews.tracks.map((track, index) => {
      const content = <>
        <span className={styles.trackInfo}>
          <span className={styles.meta}>{[track.type, track.year].filter(Boolean).join(' / ')}</span>
          <strong>{track.title}</strong>
        </span>
        {track.link && <span className={styles.listen}>
          <span className={styles.listenLabel}>{t('music_listen_on', { platform: track.platform })}</span>
          <span className={styles.listenPlatform} aria-hidden="true">{track.platform || (isKorean ? '감상' : 'Listen')}</span>
          <span className="sr-only">{isKorean ? ' (새 창)' : ' (opens in a new tab)'}</span>
        </span>}
      </>;
      return <li key={track.id} data-featured={index === 0}>
        {track.link ? <a className={styles.track} href={track.link} target="_blank" rel="noopener noreferrer">{content}</a>
          : <div className={styles.track}>{content}</div>}
      </li>;
    })}
  </ul>;

  if (section.path === '/events') return previews?.events.length ? <div className={styles.events}>
    {previews.events.map((event) => <Link key={event.id} href={`/events/${event.id}`}>
      <div>
        <time dateTime={event.date.replace(/\./g, '-')}>{event.date.replace(/\./g, '-')}</time>
        <strong>{event.title}</strong>
        <span className={styles.meta}>{event.venue}{event.status === 'Cancelled' ? ` / ${event.status}` : ''}</span>
      </div>
      {event.posterImageId && <img src={getPublicImageUrl(event.posterImageId)} alt="" loading="lazy" />}
    </Link>)}
  </div> : <p className={styles.empty}>{isKorean ? '예정된 공연이 없습니다.' : 'No upcoming events.'}</p>;

  if (section.path === '/archive' && previews?.photos.length) return <div className={styles.photos}>
    {previews.photos.map((photo) => <Link key={photo.id} href={`/archive/${photo.id}`} aria-label={photo.caption || photo.altText || (isKorean ? '이미지 보기' : 'View image')}>
      <img src={getPublicImageUrl(photo.id)} alt={photo.altText || photo.caption} loading="lazy" />
    </Link>)}
  </div>;

  if (section.path === '/about' && artistFacts.length) return <dl className={styles.facts}>
    {artistFacts.map((info) => <div key={info.id}><dt className={styles.meta}>{info.key}</dt><dd>{info.value}</dd></div>)}
  </dl>;

  return !['/music', '/archive', '/about'].includes(section.path) && section.description
    ? <p className={styles.empty}>{section.description}</p> : null;
}
