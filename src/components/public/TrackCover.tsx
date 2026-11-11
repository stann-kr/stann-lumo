"use client";

import LoadingImage from "@/capabilities/media/LoadingImage";
import { trackCoverUrl } from "@/capabilities/media/trackArt";
import type { Track } from "@/capabilities/content/content";
import styles from "./TrackCover.module.css";

type CoverTrack = Pick<Track, "id" | "type" | "link" | "coverImageId">;

/** Square cover plate: uploaded cover, else the platform's artwork, else the type label on a band plate. */
export default function TrackCover({ track, className, eager = false, showType = true }: { track: CoverTrack; className?: string; eager?: boolean; showType?: boolean }) {
  const src = trackCoverUrl(track);
  return (
    <span className={`${styles.cover} ${className ?? ""}`} aria-hidden="true" data-art={Boolean(src)}>
      {src && <LoadingImage src={src} alt="" quiet loading={eager ? "eager" : "lazy"} className={styles.art} />}
      {showType && track.type && <span className={styles.chip}>{track.type}</span>}
    </span>
  );
}
