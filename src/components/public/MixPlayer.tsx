"use client";

import { useState, type ReactNode } from "react";
import { mixEmbed } from "@/capabilities/media/mixEmbed";
import styles from "./MixPlayer.module.css";

const COPY = {
  ko: { play: (t: string) => `${t} 재생`, openOn: (p: string) => `${p}에서 듣기`, newTab: " (새 창)", player: (t: string) => `${t} 플레이어` },
  en: { play: (t: string) => `Play ${t}`, openOn: (p: string) => `Listen on ${p}`, newTab: " (opens in a new tab)", player: (t: string) => `${t} player` },
} as const;

interface MixPlayerProps {
  title: string;
  link: string;
  platform: string;
  language: "ko" | "en";
  /** Artwork shown in the screen before the host player loads. */
  poster?: ReactNode;
  /** Title over the artwork before the host player loads (the host's player shows its own). */
  heading?: ReactNode;
  /** One line of facts in the bar under the screen, in every state. */
  facts?: string;
  /** Controlled open state, so a deck can keep the player open while it switches mixes. */
  open?: boolean;
  onOpen?: () => void;
}

/**
 * A fixed 16:9 screen with a bar under it. Closed, it shows the mix artwork and a red play key; open, the host's own
 * player fills the same screen. Every state and host has the same size, so neither pressing play nor switching
 * mixes moves the layout. Hosts without an embed open in a new tab.
 */
export default function MixPlayer({ title, link, platform, language, poster, heading, facts, open, onOpen }: MixPlayerProps) {
  const copy = COPY[language];
  const embed = mixEmbed(link);
  const [ownOpen, setOwnOpen] = useState(false);
  const loaded = Boolean(embed) && (open ?? ownOpen);
  const host = platform || "Web";
  const key = <span className={styles.playKey} aria-hidden="true"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 3 L19 11 L5 19 Z" fill="currentColor" /></svg></span>;
  const screen = (control: ReactNode) => <div className={styles.screen}>{poster && <span className={styles.poster} aria-hidden="true">{poster}</span>}{heading && <div className={styles.heading}>{heading}</div>}{control}</div>;
  const factLine = <span className={styles.facts}>{facts}</span>;

  if (!embed) {
    return (
      <div className={styles.player}>
        {screen(<a className={styles.control} href={link} target="_blank" rel="noopener noreferrer" aria-label={`${copy.openOn(host)}${copy.newTab}`}>{key}</a>)}
        <p className={styles.bar}>{factLine}<span className={styles.host} aria-hidden="true">{host} ↗</span></p>
      </div>
    );
  }
  if (loaded) {
    return (
      <div className={styles.player} data-provider={embed.provider}>
        <div className={styles.screen}><iframe src={embed.src} title={copy.player(title)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
        <p className={styles.bar}>{factLine}<a className={styles.source} href={link} target="_blank" rel="noopener noreferrer" aria-label={`${copy.openOn(host)}${copy.newTab}`}>{host} ↗</a></p>
      </div>
    );
  }
  return (
    <div className={styles.player}>
      {screen(<button type="button" className={styles.control} onClick={() => { setOwnOpen(true); onOpen?.(); }} aria-label={copy.play(title)}>{key}</button>)}
      <p className={styles.bar}>{factLine}<span className={styles.host} aria-hidden="true">{host}</span></p>
    </div>
  );
}
