'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from '@/components/feature/PageLayout';
import Link from '../feature/PublicLink';
import PlayTrackKey from '../feature/player/PlayTrackKey';
import { hasKnownDuration, isMixType, type Track } from '@/capabilities/content/content';
import { tracklistLines } from '@/capabilities/content/trackMedia';
import { trackStoreLinks } from '@/capabilities/media/storeLinks';
import TrackCover from './TrackCover';
import DetailMore from './DetailMore';
import v5 from '@/styles/v5.module.css';
import styles from './MusicDetailPageClient.module.css';

interface MusicDetailPageClientProps { track: Track; previous: Track | null; next: Track | null; more?: Track[] }

/* v5 music detail, laid out like the event detail: the cover on the left at a readable size, the fact plate filling the
   rest of the width with the tracklist under it. Play is the red signal key and sends the track to the site player, so it
   keeps playing on other pages; the host and stores follow as outbound keys. More of the same kind closes the page. */
export default function MusicDetailPageClient({ track, previous, next, more = [] }: MusicDetailPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const newTab = isKorean ? ' (새 창)' : ' (opens in a new tab)';
  const lines = tracklistLines(track.tracklist);
  const outbound = [
    ...(track.link ? [{ platform: track.platform || (isKorean ? '원본' : 'Source'), url: track.link }] : []),
    ...trackStoreLinks(track.link),
  ];
  const kind = isMixType(track.type) ? 'Mix' : 'Release';
  return (
    <PageLayout title={track.title} titleSize="display" eyebrow={<Link href="/music">{t('music_title')}</Link>}>
      <div className={styles.detail}>
        <div className={`${v5.inset} ${styles.art}`}><TrackCover track={track} className={styles.cover} eager /></div>
        <div className={styles.info}>
          <aside className={`${v5.plate} ${styles.facts}`} aria-label={isKorean ? '음악 정보' : 'Track information'}>
            <div className={v5.band}><span className={v5.label}>{kind}</span>{track.year && <span className={`${v5.label} ${v5.muted}`}>{track.year}</span>}</div>
            <dl className={styles.factGrid}>
              {track.type && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '종류' : 'Type'}</dt><dd>{track.type}</dd></div>}
              {track.platform && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '플랫폼' : 'Platform'}</dt><dd>{track.platform}</dd></div>}
              {track.year && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '연도' : 'Year'}</dt><dd className={v5.mono}>{track.year}</dd></div>}
              {hasKnownDuration(track.duration) && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '길이' : 'Length'}</dt><dd className={v5.mono}>{track.duration}</dd></div>}
              {track.recordedOn && <div className={styles.fact}><dt className={v5.label}>{isKorean ? '녹음' : 'Recorded'}</dt><dd className={v5.mono}><time dateTime={track.recordedOn}>{track.recordedOn.replaceAll('-', '.')}</time></dd></div>}
            </dl>
            <div className={styles.actions}>
              <PlayTrackKey track={track} className={`${v5.key} ${v5.red} ${styles.play}`} />
              {outbound.length > 0 && (
                <div className={styles.outbound}>
                  <p className={`${v5.label} ${v5.muted}`}>{isKorean ? '외부에서 듣기' : 'Listen elsewhere'}</p>
                  <div className={styles.outboundKeys}>
                    {outbound.map((store) => (
                      <a key={store.url} href={store.url} target="_blank" rel="noopener noreferrer" className={v5.key}>
                        {store.platform} ↗<span className="sr-only"> — {track.title}{newTab}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
          {lines.length > 0 && (
            <section className={`${v5.plate} ${styles.tracks}`} aria-labelledby="music-tracklist">
              <div className={v5.band}><h2 id="music-tracklist" className={v5.label}>{isKorean ? '트랙리스트' : 'Tracklist'}</h2><span className={`${v5.label} ${v5.muted}`}>{String(lines.length).padStart(2, '0')}</span></div>
              <ol className={styles.tracklist}>{lines.map((line, index) => <li key={index}><span className={v5.mono} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{line}</span></li>)}</ol>
            </section>
          )}
        </div>
      </div>
      <DetailMore
        id="music-more"
        title={kind === 'Mix' ? (isKorean ? '다른 믹스' : 'More mixes') : (isKorean ? '다른 릴리스' : 'More releases')}
        all={{ href: '/music', label: isKorean ? '전체 음악' : 'All music' }}
        items={more.map((item) => ({
          id: item.id,
          href: `/music/${encodeURIComponent(item.id)}`,
          title: item.title,
          meta: [item.platform, item.year].filter(Boolean).join(' · '),
          media: <TrackCover track={item} />,
        }))}
      />
      {(previous || next) && (
        <nav className={styles.pager} aria-label={isKorean ? '다른 음악' : 'More music'}>
          {previous ? <Link href={`/music/${encodeURIComponent(previous.id)}`} className={styles.step} rel="prev"><span className={`${v5.label} ${v5.muted}`}>← {isKorean ? '이전' : 'Previous'}</span><strong>{previous.title}</strong></Link> : <span />}
          {next ? <Link href={`/music/${encodeURIComponent(next.id)}`} className={`${styles.step} ${styles.stepNext}`} rel="next"><span className={`${v5.label} ${v5.muted}`}>{isKorean ? '다음' : 'Next'} →</span><strong>{next.title}</strong></Link> : <span />}
        </nav>
      )}
    </PageLayout>
  );
}
