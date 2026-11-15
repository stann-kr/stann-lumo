"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";
import type { Track } from "@/capabilities/content/content";

/** What the dock needs to show and load a track; the public projections already carry these fields. */
export type PlayerTrack = Pick<Track, "id" | "title" | "link" | "platform"> & Partial<Pick<Track, "type" | "coverImageId">>;

export interface PlayerControls {
  current: PlayerTrack | null;
  /** Loads the track in the dock; the same track again keeps the running player as it is. */
  play: (track: PlayerTrack) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerControls | null>(null);

/**
 * One player for the public site. It lives in the public shell, above every page, so the host's player keeps playing
 * while the visitor moves between pages or switches language (both are client navigations that keep the shell).
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const play = useCallback((track: PlayerTrack) => {
    setCurrent((playing) => playing?.id === track.id && playing.link === track.link ? playing : track);
  }, []);
  const close = useCallback(() => setCurrent(null), []);
  const controls = useMemo(() => ({ current, play, close }), [current, play, close]);
  return <PlayerContext value={controls}>{children}</PlayerContext>;
}

/** The site player, or null outside the public shell (admin previews, isolated tests). */
export function usePlayer(): PlayerControls | null {
  return use(PlayerContext);
}
