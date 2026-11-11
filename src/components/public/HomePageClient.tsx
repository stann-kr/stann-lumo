"use client";

import { useState } from "react";
import Link from "../feature/PublicLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_NAME } from "@/constants/site";
import { hasKnownDuration, type ArtistInfoItem, type HomeEventPreview, type HomePreviews } from "@/capabilities/content/content";
import { performanceDate, performanceLocation, performanceToday } from "@/capabilities/events/events";
import { getPublicImageUrl } from "@/capabilities/media/media";
import styles from "./HomePageClient.module.css";
import MixPlayer from "./MixPlayer";
import TrackCover from "./TrackCover";
import LoadingImage from "@/capabilities/media/LoadingImage";

/* v5 home — canvas boards Main (1440) and Mobile (390): https://claude.ai/artifact/LsKdx338m7MYQNUuEREhYQ */

interface HomePageClientProps {
  artistInfo: ArtistInfoItem[];
  previews?: HomePreviews;
}

type Track = HomePreviews["tracks"][number];

const COPY = {
  ko: {
    latestMix: "최근 믹스", allMixes: "모든 믹스 →", all: "전체 →",
    datesAll: "전체 일정 · 지난 공연 →", noDates: "예정된 공연이 없습니다.", followDates: "다음 일정 소식 받기 ↗", past: "지난 공연",
    bookingLead: "클럽·페스티벌·브랜드 이벤트 섭외", inquiry: "문의 보내기 →", photosAll: "사진 전체 →", viewImage: "이미지 보기",
    newTab: " (새 창)", mixesLabel: "믹스와 릴리스", recentMixes: "최근 믹스 목록",
  },
  en: {
    latestMix: "Latest mix", allMixes: "All mixes →", all: "All →",
    datesAll: "All dates · past shows →", noDates: "No upcoming dates.", followDates: "Get notified of new dates ↗", past: "Past",
    bookingLead: "Clubs, festivals and brand events", inquiry: "Send inquiry →", photosAll: "All photos →", viewImage: "View image",
    newTab: " (opens in a new tab)", mixesLabel: "Mixes and releases", recentMixes: "Recent mixes",
  },
} as const;

const isMix = (track: Track) => /mix|set/i.test(track.type);

function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${performanceDate(date)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

function trackMeta(track: Track): string {
  return [isMix(track) ? "MIX" : track.type ? "RELEASE" : "", track.platform, track.year].filter(Boolean).join(" · ");
}

export default function HomePageClient({ artistInfo, previews }: HomePageClientProps) {
  const { language } = useLanguage();
  const copy = COPY[language === "ko" ? "ko" : "en"];
  const artistName = artistInfo.find((item) => item.key === "Name" || item.key === "이름")?.value || SITE_NAME;
  const tracks = previews?.tracks ?? [];
  const recentMixes = tracks.filter(isMix).slice(0, 4);
  const deck = recentMixes.length > 0 ? recentMixes : tracks.slice(0, 1);
  const [selectedMixId, setSelectedMixId] = useState<string | null>(null);
  const latestMix = deck.find((track) => track.id === selectedMixId) ?? deck[0];
  const cards = tracks.slice(0, 4);
  const upcoming = previews?.events ?? [];
  const past = previews?.pastEvents ?? [];
  const next = upcoming[0];
  const photos = previews?.photos ?? [];
  const today = performanceToday();
  const [firstName, ...restName] = artistName.split(/\s+/);

  const external = (label: string) => <>{label}<span className="sr-only">{copy.newTab}</span></>;

  const eventRow = (event: HomeEventPreview, index: number, isPast = false) => {
    const city = performanceLocation(event);
    const key = !isPast && event.raEventLink && event.raHasTickets
      ? <a className={`${styles.rowKey} ${styles.signal}`} href={event.raEventLink} target="_blank" rel="noopener noreferrer">{external("TICKETS ↗")}</a>
      : event.status === "TBA" ? <span className={styles.rowKeyMuted}>TBA</span>
      : <Link className={styles.rowKey} href={`/events/${event.id}`}>INFO →</Link>;
    return (
      <li key={event.id} className={styles.dateRow} data-alt={index % 2 === 1}>
        <time className={styles.mono} dateTime={performanceDate(event.date)}>{performanceDate(event.date)}</time>
        <span className={styles.label}>{city || "—"}</span>
        <Link className={styles.dateTitle} href={`/events/${event.id}`}>{event.venue ? `${event.venue} — ${event.title}` : event.title}</Link>
        {key}
      </li>
    );
  };

  return (
    <div className={styles.home}>
      <div className={styles.heroRow}>
        <section className={styles.hero} aria-labelledby="home-title">
          {/* A real image (not a CSS background) so the reveal gate can wait for it and the browser fetches it first. */}
          <img className={styles.heroImage} src="/press/front.jpg" alt="" width={1024} height={1400} fetchPriority="high" decoding="async" />
          <span className={`${styles.label} ${styles.badge}`}>Resident · Faust Seoul</span>
          <div>
            <p className={`${styles.label} ${styles.heroKicker}`}>DJ · Producer — Seoul</p>
            <h1 id="home-title" className={styles.heroTitle}>{firstName}{restName.length > 0 && <><br />{restName.join(" ")}</>}</h1>
          </div>
        </section>

        {latestMix && (
          <section className={styles.mix} aria-labelledby="home-mix">
            <div className={styles.band}><h2 id="home-mix" className={styles.label}>{copy.latestMix}</h2>{deck.length > 1
              ? <span className={`${styles.label} ${styles.muted}`}>{String(deck.indexOf(latestMix) + 1).padStart(2, "0")} / {String(deck.length).padStart(2, "0")}</span>
              : latestMix.platform && <span className={`${styles.label} ${styles.muted}`}>{latestMix.platform}</span>}</div>
            {/* Every deck entry's heading and facts share one grid cell, so switching mixes never changes the column's
                height and the hero beside it keeps its size; only the selected entry is visible. */}
            <div className={styles.mixStack}>
              {(deck.length > 1 ? deck : [latestMix]).map((mix) => {
                const current = mix.id === latestMix.id;
                return (
                  <div key={mix.id} className={styles.mixPanel} data-current={current} aria-hidden={!current || undefined} inert={!current || undefined}>
                    <div className={styles.mixHead}>
                      <p className={styles.mixTitle}>{mix.title}</p>
                      <p className={styles.mixType}>{[mix.type, mix.platform].filter(Boolean).join(" · ")}</p>
                    </div>
                    <dl className={styles.mixFacts}>
                      {hasKnownDuration(mix.duration) && <div><dt className={styles.label}>Length</dt><dd className={styles.mono}>{mix.duration}</dd></div>}
                      {mix.recordedOn
                        ? <div><dt className={styles.label}>Rec</dt><dd className={styles.mono}><time dateTime={mix.recordedOn}>{mix.recordedOn.replaceAll("-", ".")}</time></dd></div>
                        : mix.year && <div><dt className={styles.label}>Year</dt><dd className={styles.mono}>{mix.year}</dd></div>}
                    </dl>
                  </div>
                );
              })}
            </div>
            {latestMix.link && <MixPlayer key={latestMix.id} title={latestMix.title} link={latestMix.link} platform={latestMix.platform} language={language === "ko" ? "ko" : "en"} />}
            {deck.length > 1 && (
              <ul className={styles.deck} aria-label={copy.recentMixes}>
                {deck.map((track, index) => {
                  const current = track.id === latestMix.id;
                  return (
                    <li key={track.id}>
                      <button type="button" className={styles.deckRow} aria-pressed={current} onClick={() => setSelectedMixId(track.id)}>
                        <span className={`${styles.mono} ${styles.deckIndex}`} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <TrackCover track={track} className={styles.deckCover} showType={false} eager />
                        <span className={styles.deckTitle}>{track.title}</span>
                        <span className={`${styles.mono} ${styles.deckMeta}`}>{track.recordedOn ? track.recordedOn.replaceAll("-", ".") : track.year}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={styles.keyGrid}>
              <Link className={styles.plateKey} href="/music">{copy.allMixes}</Link>
            </div>
          </section>
        )}
      </div>

      {next && (
        <div className={styles.next}>
          <span className={`${styles.label} ${styles.lamp}`}><span aria-hidden="true" className={styles.dot} />Next · D-{String(Math.max(0, daysUntil(next.date, today))).padStart(2, "0")}</span>
          <time className={styles.mono} dateTime={performanceDate(next.date)}>{performanceDate(next.date)}{next.time ? ` ${next.time}` : ""}</time>
          <Link className={styles.nextTitle} href={`/events/${next.id}`}>{next.title}</Link>
          <span className={styles.nextVenue}>{[next.venue, performanceLocation(next)].filter(Boolean).join(", ")}</span>
          {next.raEventLink && next.raHasTickets
            ? <a className={`${styles.rowKey} ${styles.signal}`} href={next.raEventLink} target="_blank" rel="noopener noreferrer">{external("TICKETS ↗")}</a>
            : <Link className={styles.rowKey} href={`/events/${next.id}`}>INFO →</Link>}
        </div>
      )}

      {cards.length > 0 && (
        <section className={styles.plate} aria-labelledby="home-mixes">
          <div className={styles.plateHead}><h2 id="home-mixes" className={styles.display}>Mixes &amp; releases</h2><Link href="/music">{copy.all}</Link></div>
          <ul className={styles.cards} aria-label={copy.mixesLabel}>
            {cards.map((track) => (
              <li key={track.id}>
                {track.link ? (
                  <a className={styles.card} href={track.link} target="_blank" rel="noopener noreferrer">
                    <TrackCover track={track} />
                    <span className={styles.cardBody}><strong>{track.title}</strong><span className={styles.mono}>{trackMeta(track)}</span><span className="sr-only">{copy.newTab}</span></span>
                  </a>
                ) : (
                  <Link className={styles.card} href="/music">
                    <TrackCover track={track} />
                    <span className={styles.cardBody}><strong>{track.title}</strong><span className={styles.mono}>{trackMeta(track)}</span></span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.splitRow}>
        <section className={`${styles.plate} ${styles.dates}`} aria-labelledby="home-dates">
          <div className={styles.plateHead}><h2 id="home-dates" className={styles.display}>Dates</h2><Link href="/events">{copy.datesAll}</Link></div>
          {upcoming.length > 0 ? (
            <ul className={styles.dateList}>{upcoming.map((event, index) => eventRow(event, index))}</ul>
          ) : (
            <>
              <div className={styles.emptyDates}>
                <p>{copy.noDates}</p>
                <a className={styles.rowKey} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{external(copy.followDates)}</a>
              </div>
              {past.length > 0 && <>
                <p className={`${styles.label} ${styles.subhead}`}>{copy.past}</p>
                <ul className={styles.dateList}>{past.map((event, index) => eventRow(event, index, true))}</ul>
              </>}
            </>
          )}
        </section>

        <section className={styles.booking} aria-labelledby="home-booking">
          <div className={styles.bookingHead}><h2 id="home-booking" className={styles.display}>Booking</h2><p>{copy.bookingLead}</p></div>
          <dl className={styles.bookingFacts}>
            <div><dt className={styles.label}>Contact</dt><dd className={styles.mono}><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></dd></div>
            <div><dt className={styles.label}>Residency</dt><dd>Faust Seoul</dd></div>
            <div><dt className={styles.label}>Formats</dt><dd>DJ set · Live set</dd></div>
          </dl>
          <div className={styles.bookingKeys}>
            <Link className={styles.inkKey} href="/press-kit">PRESS KIT →</Link>
            <Link className={styles.redKey} href="/contact">{copy.inquiry}</Link>
          </div>
        </section>
      </div>

      {photos.length > 0 && (
        <section className={styles.plate} aria-labelledby="home-archive">
          <div className={styles.plateHead}><h2 id="home-archive" className={styles.display}>Archive</h2><Link href="/archive">{copy.photosAll}</Link></div>
          <div className={styles.strip}>
            {photos.map((photo) => (
              <Link key={photo.id} href={`/archive/${photo.id}`} aria-label={photo.caption || photo.altText || copy.viewImage}>
                <LoadingImage src={getPublicImageUrl(photo.id, 640)} alt={photo.altText || photo.caption} quiet className={styles.stripImage} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
