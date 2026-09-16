"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import Link from '../feature/PublicLink';
import { SITE_NAME } from '@/constants/site';
import type { ArtistInfoItem, DynamicSection } from "@/capabilities/content/content";
import styles from "./AboutPageClient.module.css";

interface AboutPageClientProps { artistInfo: ArtistInfoItem[]; aboutSections: DynamicSection[]; }

export default function AboutPageClient({ artistInfo, aboutSections }: AboutPageClientProps) {
  const { t } = useTranslation();
  const sortedSections = [...aboutSections].sort((a, b) => a.order - b.order);
  const artistName = artistInfo.find((info) => ['name', '이름'].includes(info.key.toLowerCase()))?.value || SITE_NAME;
  const facts = artistInfo.filter((info) => !['name', '이름'].includes(info.key.toLowerCase()));
  return (
    <PageLayout title={t("about_title")}>
      <div className={styles.about}>
        {facts.length > 0 && <dl className={styles.facts}>
          {facts.map((info) => <div key={info.id}><dt>{info.key}</dt><dd>{info.value}</dd></div>)}
        </dl>}
        <div className={styles.prose}>
          <h2 className={styles.artistName}>{artistName}</h2>
          {sortedSections.map((section) => {
            const isBiography = /^(biography|바이오그래피|약력)$/i.test(section.title.trim());
            return <section key={section.id}>
              <h3 className={isBiography ? 'sr-only' : undefined}>{section.title}</h3>
              {section.type === "paragraphs" && (section.paragraphs ?? []).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.type === "philosophy-items" && (section.items ?? []).map((item) => (
                <div key={item.id} className={styles.philosophy}>
                  {item.quote && !(isBiography && item.description) && <blockquote>{item.quote}</blockquote>}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
            </section>;
          })}
          <nav className={styles.references} aria-label={t('about_work_links')}><Link href="/music">{t('nav_music')}</Link><Link href="/events">{t('nav_events')}</Link></nav>
        </div>
      </div>
    </PageLayout>
  );
}
