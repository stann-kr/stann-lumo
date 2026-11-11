"use client";

import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import PageLayout from "@/components/feature/PageLayout";
import InfiniteList from "@/components/feature/InfiniteList";
import Link from '../feature/PublicLink';
import { hasKnownDuration, type MusicPageMeta, type Track } from "@/capabilities/content/content";
import { tracklistLines } from "@/capabilities/content/trackMedia";
import TrackCover from "./TrackCover";
import v5 from "@/styles/v5.module.css";
import styles from "./MusicPageClient.module.css";

/* v5 inner page derived from the canvas Home "Mixes & releases" plate; no Music board exists. */

interface MusicPageClientProps { musicMeta: MusicPageMeta; tracks: Track[]; }

const isMix = (track: Track) => /mix|set/i.test(track.type);

function TrackRow({ track }: { track: Track }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const newTabLabel = isKorean ? ' (새 창)' : ' (opens in a new tab)';
  const lines = tracklistLines(track.tracklist);
  return (
    <article className={styles.row}>
      <TrackCover track={track} className={styles.cover} showType={false} />
      <div className={styles.body}>
        <h3 className={styles.title}>{track.title}</h3>
        <p className={`${v5.mono} ${styles.meta}`}>{[track.type, track.platform, track.year].filter(Boolean).join(' · ')}</p>
      </div>
      <dl className={styles.facts}>
        {hasKnownDuration(track.duration) && <div><dt className={v5.label}>Length</dt><dd className={v5.mono}>{track.duration}</dd></div>}
        {track.recordedOn && <div><dt className={v5.label}>Rec</dt><dd className={v5.mono}><time dateTime={track.recordedOn}>{track.recordedOn.replaceAll('-', '.')}</time></dd></div>}
      </dl>
      {track.link && (
        <a href={track.link} target="_blank" rel="noopener noreferrer" className={`${v5.key} ${styles.listen}`}
          aria-label={`${track.title} — ${t('music_listen_on', { platform: track.platform })}${newTabLabel}`}>
          {track.platform || (isKorean ? '듣기' : 'Listen')} ↗
        </a>
      )}
      {lines.length > 0 && (
        <details className={styles.tracklist}>
          <summary className={v5.label}>{isKorean ? `트랙리스트 · ${lines.length}곡` : `Tracklist · ${lines.length}`}<span className="sr-only"> — {track.title}</span></summary>
          <ol>{lines.map((line, index) => <li key={index}><span className={v5.mono} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{line}</span></li>)}</ol>
        </details>
      )}
    </article>
  );
}

function TrackPlate({ id, title, tracks }: { id: string; title: string; tracks: Track[] }) {
  const { language } = useLanguage();
  return (
    <section className={v5.plate} aria-labelledby={id}>
      <div className={v5.band}><h2 id={id} className={v5.label}>{title}</h2><span className={`${v5.label} ${v5.muted}`}>{String(tracks.length).padStart(2, '0')}</span></div>
      <InfiniteList key={language} items={tracks} pageSize={10} className={styles.rows} label={title} renderItem={(track) => <TrackRow track={track} />} />
    </section>
  );
}

export default function MusicPageClient({ musicMeta, tracks }: MusicPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const newTabLabel = isKorean ? ' (새 창)' : ' (opens in a new tab)';
  const mixes = tracks.filter(isMix);
  const releases = tracks.filter((track) => !isMix(track));
  return (
    <PageLayout title={musicMeta.title || t("music_title")} subtitle={musicMeta.subtitle} meta={tracks.length > 0 && <>
      <div className={v5.readout}><span className={v5.label}>Mixes</span><span>{String(mixes.length).padStart(2, '0')}</span></div>
      <div className={v5.readout}><span className={v5.label}>Releases</span><span>{String(releases.length).padStart(2, '0')}</span></div>
    </>}>
      {mixes.length > 0 && <TrackPlate id="music-mixes" title="Mixes" tracks={mixes} />}
      {releases.length > 0 && <TrackPlate id="music-releases" title="Releases" tracks={releases} />}
      {tracks.length === 0 && <p className={`${v5.plate} ${v5.pad} ${styles.empty}`}>{isKorean ? '등록된 음악이 없습니다.' : 'No music has been added yet.'}</p>}
      <footer className={styles.footer}>
        <Link href="/contact" className={styles.licensing}>{t('music_licensing')}</Link>
        <div className={v5.keys}>
          <a className={v5.key} href="https://stann.kr/lumo" target="_blank" rel="noopener noreferrer">{isKorean ? '뮤직 허브' : 'Music hub'} ↗<span className="sr-only">{newTabLabel}</span></a>
          <a className={v5.key} href="https://terminal.stann.kr" target="_blank" rel="noopener noreferrer">{isKorean ? '터미널' : 'Terminal'} ↗<span className="sr-only">{newTabLabel}</span></a>
        </div>
      </footer>
    </PageLayout>
  );
}
