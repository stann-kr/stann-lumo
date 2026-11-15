"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { playerEmbed } from "@/capabilities/media/playerEmbed";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "../PublicLink";
import TrackCover from "@/components/public/TrackCover";
import { usePlayer } from "./PlayerContext";
import styles from "./PlayerDock.module.css";

const COPY = {
  ko: { region: "음악 플레이어", now: "재생 중", player: (t: string) => `${t} 플레이어`, detail: (t: string) => `${t} 상세`, collapse: "플레이어 접기", expand: "플레이어 펼치기", close: "플레이어 닫기", newTab: " (새 창)", listen: (p: string) => `${p}에서 듣기` },
  en: { region: "Music player", now: "Now playing", player: (t: string) => `${t} player`, detail: (t: string) => `${t} details`, collapse: "Collapse player", expand: "Expand player", close: "Close player", newTab: " (opens in a new tab)", listen: (p: string) => `Listen on ${p}` },
} as const;

/**
 * The site's one music player, fixed to the bottom of the viewport. The host's iframe is keyed by track and never moves
 * or remounts while the visitor browses; collapsing only shrinks its box. YouTube's player must stay visible at a usable
 * size, so only the audio hosts can collapse. On phones the full-width dock reserves its own height under the page
 * (`--player-space`, read by the shell at ≤640px) so the last rows stay reachable; the desktop panel floats beside them.
 */
export default function PlayerDock() {
  const player = usePlayer();
  const { language } = useLanguage();
  const copy = COPY[language === "ko" ? "ko" : "en"];
  const dockRef = useRef<HTMLElement | null>(null);
  // Collapsing belongs to one track: a new track opens expanded so its host's play key is in reach.
  const [collapsedId, setCollapsedId] = useState<string | null>(null);
  const current = player?.current ?? null;
  const embed = current ? playerEmbed(current.link) : null;
  const isCollapsed = Boolean(current) && collapsedId === current?.id && embed?.provider !== "youtube";
  const currentId = current?.id;
  const shown = Boolean(player && current && embed);

  useLayoutEffect(() => {
    const dock = dockRef.current;
    const root = document.documentElement;
    if (!dock) { root.style.removeProperty("--player-space"); return; }
    const update = () => root.style.setProperty("--player-space", `calc(${Math.ceil(dock.getBoundingClientRect().height)}px + var(--v5-gap))`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dock);
    return () => { observer.disconnect(); root.style.removeProperty("--player-space"); };
  }, [currentId, shown]);

  if (!player || !current || !embed) return null;

  const close = () => {
    player.close();
    // The dock leaves with its keys; give focus back to the page instead of the document body.
    document.getElementById("main-content")?.focus({ preventScroll: true });
  };
  const host = current.platform || "Web";

  return (
    <section ref={dockRef} className={styles.dock} aria-label={copy.region} data-provider={embed.provider} data-shape={embed.shape} data-collapsed={isCollapsed}>
      <div className={styles.bar}>
        <TrackCover track={{ id: current.id, link: current.link, coverImageId: current.coverImageId, type: current.type ?? "" }} className={styles.cover} showType={false} eager />
        <div className={styles.now}>
          <span className={styles.label}><span className={styles.lamp} aria-hidden="true" />{copy.now} · {host}</span>
          <Link href={`/music/${encodeURIComponent(current.id)}`} className={styles.title} aria-label={copy.detail(current.title)}>{current.title}</Link>
        </div>
        <div className={styles.keys}>
          {embed.provider !== "youtube" && (
            <button type="button" className={styles.key} aria-expanded={!isCollapsed} aria-label={isCollapsed ? copy.expand : copy.collapse}
              onClick={() => setCollapsedId(isCollapsed ? null : current.id)}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d={isCollapsed ? "M2 9 L7 4 L12 9" : "M2 5 L7 10 L12 5"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
          )}
          <a className={`${styles.key} ${styles.host}`} href={current.link} target="_blank" rel="noopener noreferrer" aria-label={`${copy.listen(host)}${copy.newTab}`}>↗</a>
          <button type="button" className={styles.key} onClick={close} aria-label={copy.close}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
        </div>
      </div>
      <div className={styles.screen}>
        <iframe key={current.id} src={embed.src} title={copy.player(current.title)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin" tabIndex={isCollapsed ? -1 : undefined} />
      </div>
    </section>
  );
}
