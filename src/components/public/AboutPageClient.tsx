"use client";

import { useTranslation } from "react-i18next";
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from "@/components/feature/PageLayout";
import ScreenPages from '@/components/feature/ScreenPages';
import Link from '../feature/PublicLink';
import { SITE_NAME } from '@/constants/site';
import type { ArtistInfoItem, DynamicSection } from "@/capabilities/content/content";
import styles from "./AboutPageClient.module.css";

interface AboutPageClientProps { artistInfo: ArtistInfoItem[]; aboutSections: DynamicSection[]; }

export default function AboutPageClient({ artistInfo, aboutSections }: AboutPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const sortedSections = [...aboutSections].sort((a, b) => a.order - b.order);
  const artistName = artistInfo.find((info) => ['name', '이름'].includes(info.key.toLowerCase()))?.value || SITE_NAME;
  const facts = artistInfo.filter((info) => !['name', '이름'].includes(info.key.toLowerCase()));
  const readingBlocks = sortedSections.flatMap((section) => {
    const isBiography = /^(biography|바이오그래피|약력)$/i.test(section.title.trim());
    const blocks = section.type === 'paragraphs'
      ? (section.paragraphs ?? []).flatMap((text) => text.split(/\n\s*\n/).filter(Boolean).map((text) => ({ text, quote: '' })))
      : (section.items ?? []).flatMap((item) => {
        const quote = item.quote && !(isBiography && item.description) ? item.quote : '';
        const paragraphs = item.description.split(/\n\s*\n/).filter(Boolean);
        return paragraphs.length ? paragraphs.map((text, index) => ({ text, quote: index === 0 ? quote : '' })) : [{ text: '', quote }];
      });
    return blocks.map((block, index) => ({ ...block, id: `${section.id}-${index}`, title: index === 0 ? section.title : '', isBiography }));
  });
  return (
    <PageLayout title={t("about_title")} fit>
      <div className={styles.about}>
        {facts.length > 0 && <dl className={styles.facts}>
          {facts.map((info) => <div key={info.id}><dt>{info.key}</dt><dd>{info.value}</dd></div>)}
        </dl>}
        <div className={styles.prose}>
          <h2 className={styles.artistName}>{artistName}</h2>
          <ScreenPages key={language} items={readingBlocks} pageSize={8} compactPageSize={2} label={t('about_title')}
            renderPage={(blocks) => blocks.map((block) => <section key={block.id}>
              {block.title && <h3 className={block.isBiography ? 'sr-only' : undefined}>{block.title}</h3>}
              {block.quote && <blockquote>{block.quote}</blockquote>}
              {block.text && <p>{block.text}</p>}
            </section>)} />
          <nav className={styles.references} aria-label={t('about_work_links')}><Link href="/music">{t('nav_music')}</Link><Link href="/events">{t('nav_events')}</Link></nav>
        </div>
      </div>
    </PageLayout>
  );
}
