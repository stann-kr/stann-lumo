"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LumoWordmark from "../base/LumoWordmark";
import {
  CONTACT_EMAIL, PRESS_BIO_TXT, PRESS_CONTACT, PRESS_FACTS, PRESS_KIT_COPY, PRESS_LOGO_FILES, PRESS_MIXES, PRESS_PDFS, PRESS_PHOTOS,
  PRESS_RELEASES, PRESS_STAGES, PRESS_VIDEO_PATH, PRESS_VIDEOS, PRESS_ZIP, pressVideoPoster,
} from "@/capabilities/presskit/pressKit";
import styles from "./PressKitPageClient.module.css";

/* v5 press kit — canvas boards Presskit (1440) and PresskitMobile (390): https://claude.ai/artifact/LsKdx338m7MYQNUuEREhYQ
   The page draws its own header (the site shell leaves its menu out here): promoters get language, the full pack and booking. */

const UI = {
  ko: {
    stages: "플레이한 무대", photosNote: "원본 해상도로 저장", copyBio: "바이오 복사", copyAddress: "주소 복사", emailBooking: "섭외 문의 메일 →",
    copied: "복사했습니다.", copyFailed: "복사하지 못했습니다. 직접 선택해 복사해 주세요.", dark: "어두운 배경", light: "밝은 배경", newTab: " (새 창)",
    bioLength: "바이오 길이", download: "내려받기", clip: "영상", downloadAll: "전체 다운로드", bioTxt: "바이오 텍스트 파일 내려받기",
  },
  en: {
    stages: "Selected stages", photosNote: "Saved at full resolution", copyBio: "Copy bio", copyAddress: "Copy address", emailBooking: "Email booking →",
    copied: "Copied.", copyFailed: "Copy failed. Please select the text and copy it.", dark: "Dark backgrounds", light: "Light backgrounds", newTab: " (opens in a new tab)",
    bioLength: "Biography length", download: "Download", clip: "clip", downloadAll: "Download all", bioTxt: "download the biography as text",
  },
} as const;

const fileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const VIDEO_TOTAL = PRESS_VIDEOS.reduce((sum, venue) => sum + venue.clips.length, 0);

export default function PressKitPageClient() {
  const { language, setLanguage } = useLanguage();
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
    <div className={styles.page}>
      <header className={styles.hdr}>
        <div className={styles.brand}>
          <Link href="/" className={styles.home} aria-label="STANN LUMO"><LumoWordmark className={styles.wordmark} title="STANN LUMO" /></Link>
          <span className={`${styles.label} ${styles.muted}`}>Press kit</span>
        </div>
        <div className={styles.keys}>
          <button type="button" className={styles.key} onClick={() => setLanguage("ko")} aria-label="언어를 한국어로 전환" aria-pressed={language === "ko"}>KO</button>
          <button type="button" className={styles.key} onClick={() => setLanguage("en")} aria-label="Switch language to English" aria-pressed={language === "en"}>EN</button>
          <a className={styles.key} href={PRESS_ZIP.file} download>{ui.downloadAll} <span className={`${styles.mono} ${styles.muted}`}>ZIP {PRESS_ZIP.size}</span></a>
          <a className={`${styles.key} ${styles.red}`} href="#press-contact">Booking</a>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="press-name">
        <figure className={styles.photo}>
          <img src={PRESS_PHOTOS[0].preview} alt={PRESS_PHOTOS[0].alt[locale]} width={1400} height={1914} />
          <figcaption className={styles.label}>Photo 01 / 03</figcaption>
        </figure>
        <div className={`${styles.plate} ${styles.intro}`}>
          <div className={styles.band}><span className={styles.label}>DJ / Producer — Seoul</span><span className={`${styles.label} ${styles.muted}`}>Resident · Faust Seoul</span></div>
          <h1 id="press-name" className={styles.name}>{firstName}<br />{lastName}</h1>
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

      <section className={styles.plate} aria-labelledby="press-stages">
        <div className={styles.band}><h2 id="press-stages" className={styles.label}>{ui.stages}</h2><span className={`${styles.label} ${styles.muted}`}>Venue · City</span></div>
        <ul className={styles.rows}>
          {PRESS_STAGES.map((stage) => (
            <li key={stage.name} className={`${styles.row} ${styles.stage}`}>
              <strong>{stage.name}</strong>
              <span className={styles.city}>{stage.city === "festival-korea" ? copy.festivalKorea : stage.city}</span>
              <span className={`${styles.label} ${styles.tag}`} data-live={Boolean(stage.live)}>
                {stage.live && <span aria-hidden="true" className={styles.lamp} data-latest={stage.live.latest} />}
                {stage.live ? `Live · ${stage.live.date}` : stage.tag}
              </span>
            </li>
          ))}
        </ul>
      </section>

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
                      <div className={styles.screen}>
                        <img src={pressVideoPoster(item.file)} alt={`${venue.venue} ${ui.clip} ${number}`} loading="lazy" width={640} height={360} />
                        <span className={`${styles.mono} ${styles.duration}`}>{item.duration}</span>
                      </div>
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
          <div className={styles.logos}>
            {(["White", "Black"] as const).map((tone) => (
              <div key={tone}>
                <div className={styles.tile} data-tone={tone}><LumoWordmark title={`STANN LUMO ${tone}`} /></div>
                <div className={styles.tileCap}><span className={styles.label}>{tone}</span><span className={`${styles.label} ${styles.muted}`}>{tone === "White" ? ui.dark : ui.light}</span></div>
                <div className={styles.keys}>
                  {PRESS_LOGO_FILES.filter((file) => file.label.startsWith(tone)).map((file) => (
                    <a key={file.file} className={styles.key} href={file.file} download aria-label={`${ui.download} ${file.label}`}>{file.label.split(" ")[1]}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.pad}><p className={`${styles.prose} ${styles.small}`}>{copy.logoNote}</p></div>
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
  );
}
