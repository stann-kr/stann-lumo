"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import Link from '../feature/PublicLink';
import { SITE_NAME } from '@/constants/site';
import type { ArtistInfoItem, DynamicSection } from "@/capabilities/content/content";
import v5 from "@/styles/v5.module.css";
import styles from "./AboutPageClient.module.css";

/* v5 about: derived from the canvas Press kit hero (photo plate beside the name plate) and its biography plate. */

interface AboutPageClientProps { artistInfo: ArtistInfoItem[]; aboutSections: DynamicSection[]; }

const isBiography = (section: DynamicSection) => /^(biography|바이오그래피|약력)$/i.test(section.title.trim());

export default function AboutPageClient({ artistInfo, aboutSections }: AboutPageClientProps) {
  const { t } = useTranslation();
  const sortedSections = [...aboutSections].sort((a, b) => a.order - b.order);
  const artistName = artistInfo.find((info) => ['name', '이름'].includes(info.key.toLowerCase()))?.value || SITE_NAME;
  const facts = artistInfo.filter((info) => !['name', '이름'].includes(info.key.toLowerCase()));
  const [firstName, ...restName] = artistName.split(/\s+/);
  const lede = sortedSections.find(isBiography)?.items?.find((item) => item.quote)?.quote;
  return (
    <PageLayout title={t("about_title")}>
      <section className={styles.hero} aria-labelledby="about-name">
        <figure className={styles.photo}>
          <img src="/press/portrait.jpg" alt={artistName} width={1024} height={1400} fetchPriority="high" decoding="async" />
        </figure>
        <div className={`${v5.plate} ${styles.intro}`}>
          <div className={v5.band}><span className={v5.label}>DJ / Producer — Seoul</span><span className={`${v5.label} ${v5.muted}`}>Resident · Faust Seoul</span></div>
          <h2 id="about-name" className={styles.name}>{firstName}{restName.length > 0 && <><br />{restName.join(" ")}</>}</h2>
          {lede && <p className={styles.lede}>{lede}</p>}
          {facts.length > 0 && <dl className={`${v5.rows} ${styles.facts}`}>
            {facts.map((info) => <div key={info.id} className={styles.fact}><dt className={v5.label}>{info.key}</dt><dd>{info.value}</dd></div>)}
          </dl>}
        </div>
      </section>

      {sortedSections.map((section) => {
        const biography = isBiography(section);
        return (
          <section key={section.id} className={v5.plate} aria-labelledby={`about-${section.id}`}>
            <div className={v5.band}><h2 id={`about-${section.id}`} className={v5.label}>{section.title}</h2></div>
            <div className={`${v5.pad} ${styles.prose}`}>
              {section.type === "paragraphs" && (section.paragraphs ?? []).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.type === "philosophy-items" && (section.items ?? []).map((item) => (
                <div key={item.id} className={styles.philosophy}>
                  {/* The biography quote already leads the intro plate. */}
                  {item.quote && !(biography && item.description) && <blockquote>{item.quote}</blockquote>}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <nav className={styles.references} aria-label={t('about_work_links')}>
        <Link className={v5.key} href="/music">{t('nav_music')} →</Link>
        <Link className={v5.key} href="/events">{t('nav_events')} →</Link>
        <Link className={v5.key} href="/press-kit">Press kit →</Link>
        <Link className={`${v5.key} ${v5.red}`} href="/contact">Booking →</Link>
      </nav>
    </PageLayout>
  );
}
