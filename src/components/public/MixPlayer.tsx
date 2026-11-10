"use client";

import { useState } from "react";
import { mixEmbed } from "@/capabilities/media/mixEmbed";
import styles from "./MixPlayer.module.css";

const COPY = {
  ko: { play: (t: string) => `${t} 재생`, load: "누르면 플레이어를 불러옵니다", openOn: (p: string) => `${p}에서 듣기`, newTab: " (새 창)", player: (t: string) => `${t} 플레이어` },
  en: { play: (t: string) => `Play ${t}`, load: "Loads the player when pressed", openOn: (p: string) => `Listen on ${p}`, newTab: " (opens in a new tab)", player: (t: string) => `${t} player` },
} as const;

/** Red play key that swaps in the host's own player on demand; hosts without an embed open in a new tab. */
export default function MixPlayer({ title, link, platform, language }: { title: string; link: string; platform: string; language: "ko" | "en" }) {
  const copy = COPY[language];
  const embed = mixEmbed(link);
  const [loaded, setLoaded] = useState(false);
  const icon = <span className={styles.playKey} aria-hidden="true"><svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 3 L19 11 L5 19 Z" fill="currentColor" /></svg></span>;

  if (!embed) {
    return (
      <a className={styles.player} href={link} target="_blank" rel="noopener noreferrer">
        {icon}<span className={styles.text}>{copy.openOn(platform || "Web")}<span className="sr-only">{copy.newTab}</span></span>
      </a>
    );
  }
  if (loaded) {
    return (
      <div className={styles.frame} data-provider={embed.provider}>
        <iframe src={embed.src} title={copy.player(title)} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        <a className={styles.source} href={link} target="_blank" rel="noopener noreferrer">{copy.openOn(platform || "Web")} ↗<span className="sr-only">{copy.newTab}</span></a>
      </div>
    );
  }
  return (
    <button type="button" className={styles.player} onClick={() => setLoaded(true)} aria-label={copy.play(title)}>
      {icon}<span className={styles.text} aria-hidden="true"><span>{platform}</span><span className={styles.hint}>{copy.load}</span></span>
    </button>
  );
}
