"use client";

import { useId, useRef, useState } from "react";
import Link from "../feature/PublicLink";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { SITE_NAME } from "@/constants/site";
import type { ArtistInfoItem, HomePageMeta, HomeSection, HomePreviews } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";
import styles from "./HomePageClient.module.css";
import KineticHeading from '../feature/KineticHeading';
import { useHomeMotion } from './useHomeMotion';
import HomePanelPreview, { getHomePanelSummary } from './HomePanelPreview';

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
  const artistName = artistInfo.find((item) => item.key === "Name" || item.key === "이름")?.value.trim() || SITE_NAME;
  const [firstName, ...remainingName] = artistName.split(/\s+/);
  const artistFacts = artistInfo.filter((info) => !['name', '이름'].includes(info.key.toLowerCase()));
  const newTabLabel = language === "ko" ? " (새 창)" : " (opens in a new tab)";

  return (
    <div ref={homeRef} className={styles.home} data-motion={isMotionEnabled ? "on" : "off"}>
      <div className={styles.stage}>
        <header className={styles.intro}>
          <KineticHeading title={firstName} extra={remainingName.length ? [remainingName.join(' ')] : undefined} />
          {homeMeta.navTitle && <p>{homeMeta.navTitle}</p>}
        </header>
        <div className={styles.panels} data-home-panels>
          {panels.map((section, index) => {
            const isExpanded = section.path === selectedPath;
            const contentId = `${panelId}-${index}`;
            const summary = getHomePanelSummary({ section, artistFacts, previews }, language === 'ko');
            return (
              <section key={`${section.path}-${index}`} className={styles.panel} data-expanded={isExpanded}>
                <span className={styles.panelEdge} data-panel-edge aria-hidden="true" />
                <h2 data-panel-heading>
                  <button type="button" id={`${contentId}-trigger`} aria-expanded={isExpanded} aria-controls={contentId}
                    aria-labelledby={`${contentId}-title`} aria-describedby={!isExpanded && summary ? `${contentId}-summary` : undefined}
                    onClick={(event) => { preparePanelTransition(event.detail > 0); setSelectedPath(isExpanded ? null : section.path); }}>
                    <span className={styles.panelSurface} data-panel-surface aria-hidden="true" />
                    <span className={styles.panelIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.panelLabel}>
                      <span id={`${contentId}-title`} className={styles.panelTitle} data-panel-title>{section.title}</span>
                      {summary && <span id={`${contentId}-summary`} className={styles.panelSummary} aria-hidden={isExpanded}>{summary}</span>}
                    </span>
                    <span className={styles.toggle} aria-hidden="true" />
                  </button>
                </h2>
                <div id={contentId} hidden={!isExpanded} className={styles.panelContent} data-panel-content>
                  <HomePanelPreview section={section} artistFacts={artistFacts} previews={previews} />
                  <Link href={section.path} className={styles.visit} data-hover>
                    <span data-hover-label>{section.path === '/music' ? (language === 'ko' ? '전체 음악' : 'All recordings')
                      : section.path === '/events' ? (language === 'ko' ? '전체 공연' : 'All events')
                      : section.path === '/archive' ? (language === 'ko' ? '아카이브 열기' : 'Open archive')
                      : section.path === '/about' ? (language === 'ko' ? '소개 읽기' : 'Read biography')
                      : section.title}</span>
                    <i className={styles.linkRule} data-hover-rule aria-hidden="true" />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {homeSections.length > 4 && (
        <div className={styles.secondary}>
          {homeSections.slice(4).map((section, index) => (
            <Link key={`${section.path}-${index}`} href={section.path} data-reveal="row">
              <h2 data-hover-label>{section.title}</h2>{section.path !== '/link' && <p>{section.description}</p>}
            </Link>
          ))}
        </div>
      )}
      {terminalInfo.url && (
        <section className={styles.terminal} aria-labelledby={`${panelId}-terminal`} data-reveal>
          <div className={styles.terminalIntro}>
            <h2 id={`${panelId}-terminal`}>{t("home_terminal_side_project")}</h2>
            {!/^terminal platform$/i.test(terminalInfo.description.trim()) && <p>{terminalInfo.description}</p>}
            <div className={styles.terminalLinks}>
              <a href="https://stann.kr/lumo" target="_blank" rel="noopener noreferrer">{language === "ko" ? "뮤직 허브" : "Music hub"}<span className="sr-only">{newTabLabel}</span></a>
              <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer">Terminal<span className="sr-only">{newTabLabel}</span></a>
            </div>
          </div>
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
