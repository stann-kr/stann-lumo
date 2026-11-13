"use client";

import Link from '../feature/PublicLink';
import { useTranslation } from "react-i18next";
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from "@/components/feature/PageLayout";
import type { LinkPageMeta, LinkPlatform } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";
import { SITE_NAME } from '@/constants/site';
import v5 from '@/styles/v5.module.css';
import styles from './LinkPageClient.module.css';

interface LinkPageClientProps { linkMeta: LinkPageMeta; linkPlatforms: LinkPlatform[]; terminalInfo: TerminalInfo; }

/** The visible destination, e.g. instagram.com/stannlumo, when the CMS text adds nothing. */
function destinationLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname.replace(/\/$/, '')}`;
  } catch { return ''; }
}

function Destination({ description, url, defaults }: { description: string; url: string; defaults: string[] }) {
  const text = description.trim();
  const isFiller = !text || defaults.includes(text.toLowerCase());
  return isFiller ? <p data-kind="url" className={v5.mono}>{destinationLabel(url)}</p> : <p>{text}</p>;
}

export default function LinkPageClient({ linkMeta, linkPlatforms, terminalInfo }: LinkPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const newTabLabel = language === 'ko' ? '새 창에서 열기' : 'Opens in a new tab';
  return (
    <PageLayout title={linkMeta.title || t("link_title")} subtitle={linkMeta.subtitle}>
      <section className={v5.plate} aria-labelledby="link-platforms">
        <div className={v5.band}><h2 id="link-platforms" className={v5.label}>Platforms</h2></div>
        <ul className={styles.platforms}>
          {linkPlatforms.map((link) => <li key={link.id}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.row}>
              <div className={styles.name}>
                <h3>{link.platform}</h3>
                <Destination description={link.description} url={link.url} defaults={['platform description', `${SITE_NAME} ${link.platform}`.toLowerCase(), link.platform.toLowerCase()]} />
              </div>
              <span className={styles.arrow} aria-hidden="true">↗</span>
              <span className="sr-only">{newTabLabel}</span>
            </a>
          </li>)}
        </ul>
      </section>
      {terminalInfo.url && <section className={`${v5.inset} ${styles.side}`} aria-labelledby="link-terminal">
        <div className={v5.band}><h2 id="link-terminal" className={v5.label}>{t("link_side_project")}</h2><span className={`${v5.label} ${v5.muted}`}>Since 2026 · Faust Seoul</span></div>
        <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer" className={styles.row}>
          <div className={styles.name}>
            <h3>{linkMeta.terminalTitle || 'Terminal'}</h3>
            <Destination description={terminalInfo.description} url={terminalInfo.url} defaults={['terminal platform']} />
          </div>
          <span className={styles.arrow} aria-hidden="true">↗</span>
          <span className="sr-only">{newTabLabel}</span>
        </a>
      </section>}
      {/* Canvas Link board: the page ends on a full-width red bar. */}
      <Link className={styles.cta} href="/contact">{t("link_footer_contact")}<span aria-hidden="true">→</span></Link>
    </PageLayout>
  );
}
