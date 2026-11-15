"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LumoWordmark from "../base/LumoWordmark";
import PageLayout from "../feature/PageLayout";
import {
  CONTACT_EMAIL, PRESS_BIO_TXT, PRESS_CONTACT, PRESS_FACTS, PRESS_KIT_COPY, PRESS_LOGOS, PRESS_MIXES, PRESS_PDFS, PRESS_PHOTOS,
  PRESS_RELEASES, PRESS_VIDEO_PATH, PRESS_VIDEOS, PRESS_ZIP, pressVideoPoster,
} from "@/capabilities/presskit/pressKit";
import v5 from "@/styles/v5.module.css";
import styles from "./PressKitPageClient.module.css";

/* v5 press kit — canvas boards Presskit (1440) and PresskitMobile (390): https://claude.ai/artifact/LsKdx338m7MYQNUuEREhYQ
   The site header stays on this page too (2026-11-16: without it there was no way back to the site). Its title plate is the
   one every inner page uses, with the full pack as the readout key beside it (2026-11-16, matched to the other menus). */

const UI = {
  ko: {
    photosNote: "원본 해상도로 저장", copyBio: "바이오 복사", copyAddress: "주소 복사", emailBooking: "섭외 문의 메일 →",
    copied: "복사했습니다.", copyFailed: "복사하지 못했습니다. 직접 선택해 복사해 주세요.", newTab: " (새 창)",
    bioLength: "바이오 길이", download: "내려받기", clip: "영상", downloadAll: "전체 다운로드", bioTxt: "바이오 텍스트 파일 내려받기",
    play: "재생", tone: { White: "어두운 배경", Black: "밝은 배경", Red: "기본색" },
  },
  en: {
    photosNote: "Saved at full resolution", copyBio: "Copy bio", copyAddress: "Copy address", emailBooking: "Email booking →",
    copied: "Copied.", copyFailed: "Copy failed. Please select the text and copy it.", newTab: " (opens in a new tab)",
    bioLength: "Biography length", download: "Download", clip: "clip", downloadAll: "Download all", bioTxt: "download the biography as text",
    play: "Play", tone: { White: "Dark backgrounds", Black: "Light backgrounds", Red: "Primary" },
  },
} as const;

const fileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const VIDEO_TOTAL = PRESS_VIDEOS.reduce((sum, venue) => sum + venue.clips.length, 0);

/** The confirmed B3 octagon mark (1500×1000, 45° chamfer 250); the tile sets its colour. */
const LumoMark = ({ title }: { title: string }) => (
  <svg viewBox="0 0 1500 1000" role="img" aria-label={title}><polygon fill="currentColor" points="250,0 1250,0 1500,250 1500,750 1250,1000 250,1000 0,750 0,250" /></svg>
);

/**
 * A clip stays a lazy poster until it is asked to play: nothing is fetched from R2 before the click (preload="none"),
 * play() runs inside the click so mobile browsers accept it, and focus moves to the player that replaces the button.
 */
function ClipPreview({ file, label, duration, playLabel }: { file: string; label: string; duration: string; playLabel: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const poster = pressVideoPoster(file);
  const start = () => {
    setStarted(true);
    const player = video.current;
    if (!player) return;
    player.focus();
    void player.play().catch(() => undefined);
  };
  return (
    <div className={styles.screen} data-started={started}>
      <video ref={video} src={`${PRESS_VIDEO_PATH}/${file}?preview`} poster={started ? poster : undefined} preload="none" playsInline
        controls={started} tabIndex={started ? 0 : -1} aria-hidden={!started} aria-label={label} />
      {!started && (
        <button type="button" className={styles.play} onClick={start} aria-label={`${playLabel} ${label}`}>
          <img src={poster} alt="" loading="lazy" width={640} height={360} />
          <span className={styles.playKey} aria-hidden="true">▶</span>
        </button>
      )}
      {!started && <span className={`${styles.mono} ${styles.duration}`}>{duration}</span>}
    </div>
  );
}

export default function PressKitPageClient() {
  const { language } = useLanguage();
  const locale = language === "ko" ? "ko" : "en";
  const copy = PRESS_KIT_COPY[locale];
  const ui = UI[locale];
  const [bio, setBio] = useState<"short" | "full">("full");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);

  const writeClipboard = async (text: string) => {
    let message: string = ui.copied;
    try { await navigator.clipboard.writeText(text); } catch { message = ui.copyFailed; }
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2400);
  };
  const external = (label: string) => <>{label}<span className="sr-only">{ui.newTab}</span></>;
  const bioText = bio === "short" ? copy.shortBio : copy.fullBio.join("\n\n");
  const [firstName, lastName] = ["Stann", "Lumo"];

  return (
    <PageLayout title="Press kit" meta={
      <a className={`${v5.readout} ${styles.zip}`} href={PRESS_ZIP.file} download>
        <span className={v5.label}>{ui.downloadAll}</span><span>ZIP {PRESS_ZIP.size}</span>
      </a>
    }>
      <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="press-name">
        <figure className={styles.photo}>
          <img src={PRESS_PHOTOS[0].preview} alt={PRESS_PHOTOS[0].alt[locale]} width={1400} height={1914} />
          <figcaption className={styles.label}>Photo 01 / 03</figcaption>
        </figure>
        <div className={`${styles.plate} ${styles.intro}`}>
          <div className={styles.band}><span className={styles.label}>DJ / Producer — Seoul</span><span className={`${styles.label} ${styles.muted}`}>Resident · Faust Seoul</span></div>
          <h2 id="press-name" className={styles.name}>{firstName}<br />{lastName}</h2>
          <p className={styles.lede}>{copy.shortBio}</p>
          <dl className={`${styles.rows} ${styles.glance}`}>
            <div className={styles.row}><dt className={styles.label}>Based</dt><dd>{PRESS_FACTS.based}</dd></div>
            <div className={styles.row}><dt className={styles.label}>Residency</dt><dd>{PRESS_FACTS.residency}</dd></div>
            <div className={styles.row}><dt className={styles.label}>Sound</dt><dd>{PRESS_FACTS.sound}</dd></div>
            <div className={styles.row}><dt className={styles.label}>Formats</dt><dd>{PRESS_FACTS.formats}</dd></div>
            <div className={styles.row}><dt className={styles.label}>Project</dt><dd>{PRESS_FACTS.project}</dd></div>
            <div className={styles.row}><dt className={styles.label}>Contact</dt><dd className={styles.mono}><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></dd></div>
          </dl>
        </div>
      </section>

      <section className={styles.plate} aria-labelledby="press-bio">
        <div className={styles.band}>
          <h2 id="press-bio" className={styles.label}>Biography</h2>
          <div className={styles.keys} role="group" aria-label={ui.bioLength}>
            <button type="button" className={styles.key} aria-pressed={bio === "short"} onClick={() => setBio("short")}>Short</button>
            <button type="button" className={styles.key} aria-pressed={bio === "full"} onClick={() => setBio("full")}>Full</button>
          </div>
        </div>
        <div className={`${styles.pad} ${styles.bio}`}>
          {bio === "short" ? <p className={styles.lead}>{copy.shortBio}</p>
            : copy.fullBio.map((paragraph, index) => <p key={index} className={index === 0 ? styles.lead : undefined}>{paragraph}</p>)}
        </div>
        <div className={`${styles.keys} ${styles.inset}`}>
          <button type="button" className={styles.key} onClick={() => writeClipboard(bioText)}>{ui.copyBio}</button>
          <a className={styles.key} href={PRESS_BIO_TXT.ko} download aria-label={`KO .txt — ${ui.bioTxt}`}>KO .txt</a>
          <a className={styles.key} href={PRESS_BIO_TXT.en} download aria-label={`EN .txt — ${ui.bioTxt}`}>EN .txt</a>
        </div>
      </section>

      <div className={styles.two}>
        <section className={styles.plate} aria-labelledby="press-sound">
          <div className={styles.band}><h2 id="press-sound" className={styles.label}>Sound</h2></div>
          <div className={styles.pad}><p className={styles.prose}>{copy.sound}</p></div>
        </section>
        <section className={styles.plate} aria-labelledby="press-live">
          <div className={styles.band}><h2 id="press-live" className={styles.label}>Live set</h2><span className={`${styles.label} ${styles.muted}`}>Ableton Live</span></div>
          <div className={styles.pad}><p className={styles.prose}>{copy.liveSet}</p></div>
        </section>
      </div>

      <div className={styles.two}>
        {([["press-mixes", "Selected mixes", PRESS_MIXES], ["press-releases", "Selected releases", PRESS_RELEASES]] as const).map(([id, title, items]) => (
          <section key={id} className={styles.plate} aria-labelledby={id}>
            <div className={styles.band}><h2 id={id} className={styles.label}>{title}</h2><span className={`${styles.label} ${styles.muted}`}>{items.length}</span></div>
            <ul className={styles.rows}>
              {items.map((item) => (
                <li key={item.url}>
                  <a className={`${styles.row} ${styles.media}`} href={item.url} target="_blank" rel="noopener noreferrer">
                    <span><strong>{item.title}</strong>{"meta" in item && <span className={`${styles.mono} ${styles.muted} ${styles.small}`}>{item.meta}</span>}</span>
                    <span className={`${styles.label} ${styles.source}`}>{external(`${item.source} ↗`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className={styles.plate} aria-labelledby="press-photos">
        <div className={styles.band}><h2 id="press-photos" className={styles.label}>Press photos</h2><span className={`${styles.label} ${styles.muted}`}>{ui.photosNote}</span></div>
        <ul className={styles.photos}>
          {PRESS_PHOTOS.map((photo, index) => (
            <li key={photo.file}>
              <figure className={styles.ph}>
                <div className={styles.frame}><img src={photo.preview} alt={photo.alt[locale]} loading="lazy" /></div>
                <figcaption className={styles.meta}>
                  <span className={`${styles.mono} ${styles.muted} ${styles.small}`}>{String(index + 1).padStart(2, "0")} · {photo.size.split(" · ").slice(0, 2).join(" · ")}</span>
                  <a className={styles.key} href={photo.file} download aria-label={`${ui.download} ${fileName(photo.file)} (${photo.size.split(" · ")[2]})`}>↓ {photo.size.split(" · ")[2]}</a>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.plate} aria-labelledby="press-video">
        <div className={styles.band}><h2 id="press-video" className={styles.label}>Performance video</h2><span className={`${styles.label} ${styles.muted}`}>{VIDEO_TOTAL} · MP4</span></div>
        {PRESS_VIDEOS.map((venue) => (
          <div key={venue.venue} className={styles.venue}>
            <h3 className={styles.venueHead}><strong>{venue.venue}</strong><span className={`${styles.mono} ${styles.muted} ${styles.small}`}>{venue.clips.length}</span></h3>
            <ul className={styles.clips}>
              {venue.clips.map((item, index) => {
                const number = String(index + 1).padStart(2, "0");
                return (
                  <li key={item.file}>
                    <figure className={styles.ph}>
                      <ClipPreview file={item.file} label={`${venue.venue} ${ui.clip} ${number}`} duration={item.duration} playLabel={ui.play} />
                      <figcaption className={styles.meta}>
                        <span className={`${styles.mono} ${styles.muted} ${styles.small}`}>{number}</span>
                        <a className={styles.key} href={`${PRESS_VIDEO_PATH}/${item.file}`} download aria-label={`${ui.download} ${venue.venue} ${ui.clip} ${number} (${item.size})`}>↓ {item.size}</a>
                      </figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className={styles.pad}><p className={`${styles.prose} ${styles.small}`}>{copy.videoNote}</p></div>
      </section>

      <div className={styles.two}>
        <section className={styles.plate} aria-labelledby="press-logo">
          <div className={styles.band}><h2 id="press-logo" className={styles.label}>Logo</h2><span className={`${styles.label} ${styles.muted}`}>SVG · PDF · EPS · PNG</span></div>
          {PRESS_LOGOS.map((set) => (
            <div key={set.kind} className={styles.logoSet}>
              <h3 className={styles.venueHead}><strong>{set.kind}</strong><span className={`${styles.mono} ${styles.muted} ${styles.small}`}>{set.tones.length}</span></h3>
              <div className={styles.logos} data-kind={set.kind}>
                {set.tones.map(({ tone, files }) => (
                  <div key={tone}>
                    <div className={styles.tile} data-tone={tone} data-kind={set.kind}>
                      {set.kind === "Mark" ? <LumoMark title={`STANN LUMO mark ${tone}`} /> : <LumoWordmark title={`STANN LUMO ${tone}`} />}
                    </div>
                    <div className={styles.tileCap}><span className={styles.label}>{tone}</span><span className={`${styles.label} ${styles.muted}`}>{ui.tone[tone as keyof typeof ui.tone]}</span></div>
                    <div className={styles.keys}>
                      {files.map((file) => (
                        <a key={file.file} className={styles.key} href={file.file} download aria-label={`${ui.download} ${file.label}`}>{file.format}</a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.pad}><p className={`${styles.prose} ${styles.small} ${styles.logoNote}`}>{copy.logoNote}</p></div>
        </section>
        <section className={`${styles.plate} ${styles.column}`} aria-labelledby="press-terminal">
          <div className={styles.band}><h2 id="press-terminal" className={styles.label}>TERMINAL</h2><span className={`${styles.label} ${styles.muted}`}>Since 2026 · Faust Seoul</span></div>
          <div className={`${styles.pad} ${styles.terminal}`}>
            <p className={styles.prose}>{copy.terminal}</p>
            <a className={styles.key} href="https://terminal.stann.kr/" target="_blank" rel="noopener noreferrer">{external("terminal.stann.kr ↗")}</a>
          </div>
        </section>
      </div>

      <section id="press-contact" className={styles.contact} aria-labelledby="press-contact-title">
        <div className={styles.column}>
          <div className={styles.band}><h2 id="press-contact-title" className={styles.label}>Booking · Press</h2></div>
          <div className={`${styles.pad} ${styles.mailBlock}`}>
            <p className={styles.mail}>{CONTACT_EMAIL}</p>
            <div className={styles.keys}>
              <button type="button" className={`${styles.key} ${styles.ink}`} onClick={() => writeClipboard(CONTACT_EMAIL)}>{ui.copyAddress}</button>
              <a className={`${styles.key} ${styles.red}`} href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Booking — Stann Lumo")}`}>{ui.emailBooking}</a>
            </div>
          </div>
        </div>
        <ul className={`${styles.rows} ${styles.links}`}>
          {PRESS_CONTACT.map((item) => (
            <li key={item.label}>
              <a className={styles.row} href={item.url} target="_blank" rel="noopener noreferrer">
                <span className={styles.label}>{item.label}</span><span>{item.value}</span><span aria-hidden="true" className={styles.arrow}>↗</span><span className="sr-only">{ui.newTab}</span>
              </a>
            </li>
          ))}
          <li className={styles.row}>
            <span className={styles.label}>PDF</span>
            <span className={styles.keys}>
              <a className={`${styles.key} ${styles.ink}`} href={PRESS_PDFS.ko} download>KO PDF</a>
              <a className={`${styles.key} ${styles.ink}`} href={PRESS_PDFS.en} download>EN PDF</a>
            </span>
          </li>
        </ul>
      </section>

      <footer className={styles.foot}><span className={`${styles.label} ${styles.muted}`}>Stann Lumo — Press kit</span><span className={`${styles.label} ${styles.muted}`}>2026</span></footer>

      <p className={styles.toast} role="status" aria-live="polite">{notice}</p>
      </div>
    </PageLayout>
  );
}
