"use client";

import { useId, useRef, useState } from "react";
import Link from "../feature/PublicLink";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { SITE_NAME } from "@/constants/site";
import type { ArtistInfoItem, HomePageMeta, HomeSection, HomePreviews } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";
import { getPublicImageUrl } from "@/capabilities/media/media";
import styles from "./HomePageClient.module.css";
import KineticHeading from '../feature/KineticHeading';
import { useHomeMotion } from './useHomeMotion';

interface HomePageClientProps {
  artistInfo: ArtistInfoItem[];
  homeMeta: HomePageMeta;
  homeSections: HomeSection[];
  terminalInfo: TerminalInfo;
  previews?: HomePreviews;
}

export default function HomePageClient({ artistInfo, homeMeta, homeSections, terminalInfo, previews }: HomePageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isResolved, prefersReducedMotion } = useMotionPreference();
  const panelId = useId();
  const isMotionEnabled = isResolved && !prefersReducedMotion;
  // The CMS owns order: the first four sections are panels, all remaining sections stay visible below.
  const panels = homeSections.slice(0, 4);
  const [selectedPath, setSelectedPath] = useState<string | null>(() => panels.find((section) => section.path === "/music")?.path ?? panels[0]?.path ?? null);
  const homeRef = useRef<HTMLDivElement>(null);
  const preparePanelTransition = useHomeMotion(homeRef, selectedPath, isMotionEnabled);
  const artistName = artistInfo.find((item) => item.key === "Name" || item.key === "이름")?.value || SITE_NAME;
  const secondarySections = homeSections.slice(4);
  const terminalDescription = terminalInfo.description.trim();
  const newTabLabel = language === "ko" ? " (새 창)" : " (opens in a new tab)";

  return (
    <div ref={homeRef} className={styles.home} data-motion={isMotionEnabled ? "on" : "off"}>
      <header className={styles.intro}>
        <KineticHeading title={artistName} />
        {homeMeta.navTitle && <p>{homeMeta.navTitle}</p>}
      </header>
      <div className={styles.panels} data-home-panels>
        {panels.map((section, index) => {
          const isExpanded = section.path === selectedPath;
          const contentId = `${panelId}-${index}`;
          return (
            <section key={`${section.path}-${index}`} className={styles.panel} data-expanded={isExpanded}>
              <span className={styles.panelEdge} data-panel-edge aria-hidden="true" />
              <span className={styles.panelIndex} data-panel-index aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.panelRule} data-panel-rule aria-hidden="true" />
              <h2 data-panel-heading>
                <button type="button" id={`${contentId}-trigger`} aria-expanded={isExpanded} aria-controls={contentId}
                  onClick={(event) => { preparePanelTransition(event.detail > 0); setSelectedPath(isExpanded ? null : section.path); }}>
                  <span className={styles.panelTitle} data-panel-title>{section.title}</span>
                  <span className={styles.toggle} aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                </button>
              </h2>
              <div id={contentId} hidden={!isExpanded} className={styles.panelContent} data-panel-content>
                {!['/music', '/events', '/archive', '/about'].includes(section.path) && section.description && <p>{section.description}</p>}
                {section.path === '/music' && !!previews?.tracks.length && <ul className={styles.trackPreview}>
                  {previews.tracks.map((track, trackIndex) => <li key={track.id} data-featured={trackIndex === 0}>
                    <span>{[track.type, track.year].filter(Boolean).join(' / ')}</span>
                    <strong>{track.title}</strong>
                    {trackIndex === 0 && track.link && <a href={track.link} target="_blank" rel="noopener noreferrer">{t('music_listen_on', { platform: track.platform })}<span className="sr-only">{newTabLabel}</span></a>}
                  </li>)}
                </ul>}
                {section.path === '/events' && !!previews?.events.length && <div className={styles.eventPreview}>
                  {previews.events.map((event) => {
                    const date = event.date.replace(/\./g, '-');
                    const time = <time dateTime={date}>{date}</time>;
                    // Without a poster the date takes the image column, like the meta column of tracks.
                    return <Link key={event.id} href={`/events/${event.id}`} data-poster={Boolean(event.posterImageId)}>
                      {event.posterImageId ? <img src={getPublicImageUrl(event.posterImageId)} alt="" loading="lazy" /> : time}
                      <div>{event.posterImageId && time}<strong>{event.title}</strong><span>{event.venue}{event.status === 'Cancelled' ? ` / ${event.status}` : ''}</span></div>
                    </Link>;
                  })}
                </div>}
                {section.path === '/events' && !previews?.events.length && <p>{language === 'ko' ? '예정된 공연이 없습니다.' : 'No upcoming events.'}</p>}
                {section.path === '/archive' && !!previews?.photos.length && <div className={styles.photoPreview}>
                  {previews.photos.map((photo) => <Link key={photo.id} href={`/archive/${photo.id}`} aria-label={photo.caption || photo.altText || (language === 'ko' ? '이미지 보기' : 'View image')}><img src={getPublicImageUrl(photo.id)} alt={photo.altText || photo.caption} loading="lazy" /></Link>)}
                </div>}
                {section.path === '/about' && artistInfo.length > 0 && <dl className={styles.artistPreview}>
                  {artistInfo.filter((info) => !['name', '이름'].includes(info.key.toLowerCase())).map((info) => <div key={info.id}><dt>{info.key}</dt><dd>{info.value}</dd></div>)}
                </dl>}
                <Link href={section.path} className={styles.visit} data-hover>
                  <span data-hover-label>{section.path === '/music' ? (language === 'ko' ? '전체 음악' : 'All recordings')
                    : section.path === '/events' ? (language === 'ko' ? '전체 공연' : 'All events')
                    : section.path === '/archive' ? (language === 'ko' ? '아카이브 열기' : 'Open archive')
                    : section.path === '/about' ? (language === 'ko' ? '소개 읽기' : 'Read biography')
                    : section.title}</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      {(secondarySections.length > 0 || terminalInfo.url) && (
        <div className={styles.secondary}>
          {secondarySections.map((section, index) => (
            <Link key={`${section.path}-${index}`} href={section.path}>
              <h2 data-hover-label>{section.title}</h2>
              {/* The CMS default for Link is filler; the real destinations say more. */}
              {section.path === '/link'
                ? !!previews?.platforms.length && <p>{previews.platforms.join(' · ')}</p>
                : section.description && <p>{section.description}</p>}
            </Link>
          ))}
          {terminalInfo.url && (
            <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer">
              <h2 data-hover-label>Terminal</h2>
              <p>{terminalDescription && !/^terminal platform$/i.test(terminalDescription) ? terminalDescription : t("home_terminal_side_project")}</p>
              <span className="sr-only">{newTabLabel}</span>
            </a>
          )}
        </div>
      )}
      {terminalInfo.url && (!!terminalInfo.customFields?.length || terminalInfo.style?.showEmbed) && (
        <section className={styles.terminal} aria-label="Terminal">
          {!!terminalInfo.customFields?.length && (
            <dl className={styles.fields}>
              {terminalInfo.customFields.map((field) => (
                <div key={field.id}>
                  <dt>{field.fieldKey}</dt>
                  <dd>{field.fieldType === "url" ? (
                    <a href={field.fieldValue} target="_blank" rel="noopener noreferrer">{field.fieldValue}<span className="sr-only">{newTabLabel}</span></a>
                  ) : <span data-badge={field.fieldType === "badge"}>{field.fieldValue}</span>}</dd>
                </div>
              ))}
            </dl>
          )}
          {terminalInfo.style?.showEmbed && (
            <iframe src={terminalInfo.url} style={{ height: terminalInfo.style.embedHeight }} title="Terminal" sandbox="allow-scripts allow-same-origin" loading="lazy" />
          )}
        </section>
      )}
    </div>
  );
}
