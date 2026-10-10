"use client";

import Link from '../feature/PublicLink';
import { useTranslation } from "react-i18next";
import { useLanguage } from '@/contexts/LanguageContext';
import PageLayout from "@/components/feature/PageLayout";
import type { LinkPageMeta, LinkPlatform } from "@/capabilities/content/content";
import type { TerminalInfo } from "@/capabilities/terminal/terminalConfig";
import { SITE_NAME } from '@/constants/site';
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
  return isFiller ? <p data-kind="url">{destinationLabel(url)}</p> : <p>{text}</p>;
}

export default function LinkPageClient({ linkMeta, linkPlatforms, terminalInfo }: LinkPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const newTabLabel = language === 'ko' ? '새 창에서 열기' : 'Opens in a new tab';
  return (
    <PageLayout title={linkMeta.title || t("link_title")} subtitle={linkMeta.subtitle}>
      <ul className={styles.platforms}>
        {linkPlatforms.map((link) => <li key={link.id}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.row} data-hover>
            <h2 data-hover-label>{link.platform}</h2>
            <Destination description={link.description} url={link.url} defaults={['platform description', `${SITE_NAME} ${link.platform}`.toLowerCase(), link.platform.toLowerCase()]} />
            <span className="sr-only">{newTabLabel}</span>
            <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
          </a>
        </li>)}
      </ul>
      {terminalInfo.url && <section className={styles.terminal}>
        <p>{t("link_side_project")}</p>
        <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer" className={styles.row} data-hover>
          <h2 data-hover-label>{linkMeta.terminalTitle || 'Terminal'}</h2>
          <Destination description={terminalInfo.description} url={terminalInfo.url} defaults={['terminal platform']} />
          <span className="sr-only">{newTabLabel}</span>
          <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
        </a>
      </section>}
      <footer className={styles.footer}><Link href="/contact">{t("link_footer_contact")}</Link></footer>
    </PageLayout>
  );
}
