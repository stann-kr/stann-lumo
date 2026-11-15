"use client";

import { playerEmbed } from "@/capabilities/media/playerEmbed";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayer, type PlayerTrack } from "./PlayerContext";

const PLAY = <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5 L12.5 7 L3 12.5 Z" fill="currentColor" /></svg>;
const LIVE = <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 12 V7 M5.3 12 V3 M8.6 12 V5 M12 12 V8" stroke="currentColor" strokeWidth="2" /></svg>;

/**
 * Sends a track to the site player. Renders nothing for a link without a player (an unknown host or an unrecorded
 * Bandcamp release) or outside the public shell, so callers keep their outbound link as the only way to listen.
 */
export default function PlayTrackKey({ track, className }: { track: PlayerTrack; className?: string }) {
  const player = usePlayer();
  const { language } = useLanguage();
  if (!player || !playerEmbed(track.link)) return null;
  const isKorean = language === "ko";
  const playing = player.current?.id === track.id;
  const text = playing ? (isKorean ? "재생 중" : "Playing") : (isKorean ? "재생" : "Play");
  return (
    <button type="button" className={className} aria-pressed={playing} data-playing={playing} onClick={() => player.play(track)}
      aria-label={`${text} — ${track.title}`}>
      {playing ? LIVE : PLAY}<span>{text}</span>
    </button>
  );
}
