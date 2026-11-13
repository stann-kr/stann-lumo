"use client";

import { useState } from "react";
import Link from "../feature/PublicLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_NAME, SOUNDCLOUD_URL } from "@/constants/site";
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
    allMixes: "모든 믹스 →", tracklistAll: "트랙리스트 · 모든 믹스 →", firstTrack: "첫 곡", all: "전체 →",
    datesAll: "전체 일정 · 지난 공연 →", noDates: "예정된 공연이 없습니다.", followDates: "다음 일정 소식 받기 ↗", past: "지난 공연",
    bookingLead: "클럽·페스티벌·브랜드 이벤트 섭외", inquiry: "문의 보내기 →", inquiryShort: "문의 →", photosAll: "사진 전체 →", viewImage: "이미지 보기",
    newTab: " (새 창)", mixesLabel: "믹스와 릴리스", recentMixes: "최근 믹스 목록",
  },
  en: {
    allMixes: "All mixes →", tracklistAll: "Tracklist · All mixes →", firstTrack: "First track", all: "All →",
    datesAll: "All dates · past shows →", noDates: "No upcoming dates.", followDates: "Get notified of new dates ↗", past: "Past",
    bookingLead: "Clubs, festivals and brand events", inquiry: "Send inquiry →", inquiryShort: "Inquiry →", photosAll: "All photos →", viewImage: "View image",
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
  // Once a mix is playing, choosing another deck entry loads that mix's player in the same screen.
  const [playerOpen, setPlayerOpen] = useState(false);
  const latestMix = deck.find((track) => track.id === selectedMixId) ?? deck[0];
  const cards = tracks.slice(0, 4);
  const upcoming = previews?.events ?? [];
  const past = previews?.pastEvents ?? [];
  const next = upcoming[0];
  // The mobile board lists dates after the one already in the NEXT row.
  const compactDates = upcoming.length > 0 ? upcoming.slice(1) : past;
  const photos = previews?.photos ?? [];
  const today = performanceToday();
  const [firstName, ...restName] = artistName.split(/\s+/);

  /** Type, recording date (or year) and length on one line under the player screen; the bar names the host itself. */
  const mixFacts = (mix: (typeof deck)[number]) => [mix.type, mix.recordedOn ? `Rec ${mix.recordedOn.replaceAll("-", ".")}` : mix.year, hasKnownDuration(mix.duration) ? mix.duration : ""].filter(Boolean).join(" · ");

  const external = (label: string) => <>{label}<span className="sr-only">{copy.newTab}</span></>;
  /** Desktop and mobile boards word the same key differently. */
  const responsive = (wide: string, narrow: string) => <><span className={styles.wideOnly}>{wide}</span><span className={styles.narrowOnly}>{narrow}</span></>;

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

  /** Mobile board row: MM-DD, venue and city, and a quiet INFO/TBA label; the whole row opens the event. */
  const compactRow = (event: HomeEventPreview, index: number, isPast = false) => (
    <li key={event.id} data-alt={index % 2 === 1}>
      <Link className={styles.compactRow} href={`/events/${event.id}`}>
        <time className={styles.mono} dateTime={performanceDate(event.date)}>{isPast ? performanceDate(event.date) : performanceDate(event.date).slice(5)}</time>
        <span className={styles.compactPlace}>{[event.venue || event.title, performanceLocation(event)].filter(Boolean).join(", ")}</span>
        <span className={`${styles.label} ${styles.muted}`}>{event.status === "TBA" ? "TBA" : "Info"}</span>
      </Link>
    </li>
  );

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
            {/* The band reads LATEST MIX in both languages, like the other English plate heads. */}
            <div className={styles.band}><h2 id="home-mix" className={styles.label}>Latest mix</h2>{deck.length > 1
              ? <span className={`${styles.label} ${styles.muted} ${styles.wideOnly}`}>{String(deck.indexOf(latestMix) + 1).padStart(2, "0")} / {String(deck.length).padStart(2, "0")}</span>
              : latestMix.platform && <span className={`${styles.label} ${styles.muted} ${styles.wideOnly}`}>{latestMix.platform}</span>}</div>
            {/* The mix's title and facts live in the player's fixed screen and bar, so switching mixes or pressing play
                never changes the column's height and the hero beside it keeps its size. */}
            {latestMix.link ? (
              <MixPlayer key={latestMix.id} title={latestMix.title} link={latestMix.link} platform={latestMix.platform} language={language === "ko" ? "ko" : "en"}
                poster={<TrackCover track={latestMix} showType={false} eager />} heading={<p className={styles.mixTitle}>{latestMix.title}</p>}
                facts={mixFacts(latestMix)} open={playerOpen} onOpen={() => setPlayerOpen(true)} />
            ) : (
              <div className={styles.mixHead}><p className={styles.mixTitle}>{latestMix.title}</p><p className={styles.mixType}>{[mixFacts(latestMix), latestMix.platform].filter(Boolean).join(" · ")}</p></div>
            )}
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
            {/* Mobile board: the deck folds away and the mix's first track shows instead, only when it has a tracklist. */}
            {latestMix.firstTrack && (
              <p className={styles.firstTrack}><span className={`${styles.mono} ${styles.muted}`} aria-hidden="true">01</span><span className="sr-only">{copy.firstTrack}: </span><span>{latestMix.firstTrack}</span></p>
            )}
            <div className={styles.keyGrid}>
              <a className={`${styles.plateKey} ${styles.platformKey}`} href={SOUNDCLOUD_URL} target="_blank" rel="noopener noreferrer">{external("SoundCloud ↗")}</a>
              <Link className={styles.plateKey} href="/music">{latestMix.firstTrack ? responsive(copy.allMixes, copy.tracklistAll) : copy.allMixes}</Link>
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
          {/* Mobile board: one mono line, MM-DD HH:MM · venue. */}
          <span className={`${styles.mono} ${styles.nextLine}`}><time dateTime={performanceDate(next.date)}>{performanceDate(next.date).slice(5)}{next.time ? ` ${next.time}` : ""}</time>{next.venue && ` · ${next.venue}`}</span>
          {next.raEventLink && next.raHasTickets
            ? <a className={`${styles.rowKey} ${styles.nextKey} ${styles.signal}`} href={next.raEventLink} target="_blank" rel="noopener noreferrer">{external("TICKETS ↗")}</a>
            : <Link className={`${styles.rowKey} ${styles.nextKey}`} href={`/events/${next.id}`}>INFO →</Link>}
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
        {/* On mobile the next date sits in the NEXT row; with nothing after it the plate folds away. */}
        <section className={`${styles.plate} ${styles.dates}`} aria-labelledby="home-dates" data-compact-empty={compactDates.length === 0 && upcoming.length > 0}>
          <div className={styles.plateHead}><h2 id="home-dates" className={styles.display}>Dates</h2><Link href="/events">{responsive(copy.datesAll, copy.all)}</Link></div>
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
          {compactDates.length > 0 && <ul className={styles.compactDates}>{compactDates.map((event, index) => compactRow(event, index, upcoming.length === 0))}</ul>}
        </section>

        <section className={styles.booking} aria-labelledby="home-booking">
          <div className={styles.bookingHead}>
            <h2 id="home-booking" className={styles.display}>Booking</h2>
            <p className={styles.bookingLead}>{copy.bookingLead}</p>
            {/* Mobile board: the address alone replaces the lead and the fact rows. */}
            <p className={`${styles.mono} ${styles.bookingMail}`}><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          </div>
          <dl className={styles.bookingFacts}>
            <div><dt className={styles.label}>Contact</dt><dd className={styles.mono}><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></dd></div>
            <div><dt className={styles.label}>Residency</dt><dd>Faust Seoul</dd></div>
            <div><dt className={styles.label}>Formats</dt><dd>DJ set · Live set</dd></div>
          </dl>
          <div className={styles.bookingKeys}>
            <Link className={styles.inkKey} href="/press-kit">PRESS KIT →</Link>
            <Link className={styles.redKey} href="/contact">{responsive(copy.inquiry, copy.inquiryShort)}</Link>
          </div>
        </section>
      </div>

      {photos.length > 0 && (
        <section className={styles.plate} aria-labelledby="home-archive">
          <div className={styles.plateHead}><h2 id="home-archive" className={styles.display}>Archive</h2><Link href="/archive">{copy.photosAll}</Link></div>
          <div className={styles.strip}>
            {photos.map((photo) => (
              <Link key={photo.id} href={`/archive/${photo.id}`} aria-label={photo.caption || photo.altText || copy.viewImage}>
                <LoadingImage src={getPublicImageUrl(photo.id, 640)} alt={photo.altText || photo.caption} quiet />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
