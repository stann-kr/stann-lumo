"use client";

import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import PageLayout from "@/components/feature/PageLayout";
import InfiniteList from "@/components/feature/InfiniteList";
import Link from '../feature/PublicLink';
import type { MusicPageMeta, Track } from "@/capabilities/content/content";
import styles from "./MusicPageClient.module.css";

interface MusicPageClientProps { musicMeta: MusicPageMeta; tracks: Track[]; }

function TrackRow({ track, featured }: { track: Track; featured: boolean }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const newTabLabel = language === 'ko' ? ' (새 창)' : ' (opens in a new tab)';
  const content = <>
    <div className={styles.year}>{track.year}</div>
    <div className={styles.record}>
      <h2 data-hover-label>{track.title}</h2>
      {track.link && <span className={styles.listen}>{t('music_listen_on', { platform: track.platform })}</span>}
    </div>
    <div className={styles.meta}><span>{track.type}</span>{track.duration && <span className={styles.duration}>{track.duration}</span>}</div>
    {track.link && <i className={styles.rowRule} aria-hidden="true" />}
  </>;

  return track.link ? (
    <a href={track.link} target="_blank" rel="noopener noreferrer" className={styles.row} data-featured={featured} aria-label={`${track.title} — ${t('music_listen_on', { platform: track.platform })}${newTabLabel}`}>
      {content}
    </a>
  ) : <div className={styles.row} data-featured={featured}>{content}</div>;
}

export default function MusicPageClient({ musicMeta, tracks }: MusicPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const newTabLabel = isKorean ? ' (새 창)' : ' (opens in a new tab)';
  return (
    <PageLayout title={musicMeta.title || t("music_title")} subtitle={musicMeta.subtitle}>
      {tracks.length ? <InfiniteList key={language} items={tracks} pageSize={10} className={styles.tracks} label={musicMeta.title || t('music_title')}
        renderItem={(track, index) => <TrackRow track={track} featured={index === 0} />} />
        : <p className={styles.empty}>{isKorean ? '등록된 음악이 없습니다.' : 'No music has been added yet.'}</p>}
      <footer className={styles.footer}>
        <Link href="/contact">{t('music_licensing')}</Link>
        <div>
          <a href="https://stann.kr/lumo" target="_blank" rel="noopener noreferrer">{isKorean ? '뮤직 허브' : 'Music hub'}<span className="sr-only">{newTabLabel}</span></a>
          <a href="https://terminal.stann.kr" target="_blank" rel="noopener noreferrer">{isKorean ? '라이브 인터페이스' : 'Live interface'}<span className="sr-only">{newTabLabel}</span></a>
        </div>
      </footer>
    </PageLayout>
  );
}
