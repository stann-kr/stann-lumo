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

export default function LinkPageClient({ linkMeta, linkPlatforms, terminalInfo }: LinkPageClientProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const newTabLabel = language === 'ko' ? '새 창에서 열기' : 'Opens in a new tab';
  return (
    <PageLayout title={linkMeta.title || t("link_title")} subtitle={linkMeta.subtitle}>
      <ul className={styles.platforms}>
        {linkPlatforms.map((link) => <li key={link.id} data-reveal="row">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.row} data-hover>
            <h2 data-hover-label>{link.platform}</h2><p>{['platform description', `${SITE_NAME} ${link.platform}`.toLowerCase(), link.platform.toLowerCase()].includes(link.description.trim().toLowerCase()) ? '' : link.description}</p><span className="sr-only">{newTabLabel}</span>
            <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
          </a>
        </li>)}
      </ul>
      {terminalInfo.url && <section className={styles.terminal} data-reveal>
        <p>{t("link_side_project")}</p>
        <a href={terminalInfo.url} target="_blank" rel="noopener noreferrer" className={styles.row} data-hover>
          <h2 data-hover-label>{linkMeta.terminalTitle || 'Terminal'}</h2><p>{/^terminal platform$/i.test(terminalInfo.description.trim()) ? '' : terminalInfo.description}</p><span className="sr-only">{newTabLabel}</span>
          <i className={styles.rowRule} data-hover-rule aria-hidden="true" />
        </a>
      </section>}
      <footer className={styles.footer}><Link href="/contact">{t("link_footer_contact")}</Link></footer>
    </PageLayout>
  );
}
