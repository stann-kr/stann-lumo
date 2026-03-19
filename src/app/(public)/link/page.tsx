'use client';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import { PADDING_MAP, GAP_MAP, MD_GRID_COLS_MAP } from '@/utils/displaySettingsMap';

const LinkPage = () => {
  const { t } = useTranslation();
  const { content, displaySettings } = useContent();
  const { linkPlatforms, terminalInfo } = content;
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const settings = displaySettings.link;
  const cardPaddingClass = PADDING_MAP[settings.cardPadding];
  const gridGapClass = GAP_MAP[settings.gridGap];
  const gridColsClass = MD_GRID_COLS_MAP[settings.gridColumns];

  return (
    <PageLayout
      title={content.pageMeta?.link?.title || t('link_title')}
      subtitle={content.pageMeta?.link?.subtitle || t('link_subtitle')}
      spacing={settings.spacing}
    >
      {/* Terminal Featured Card */}
      {settings.showTerminalCard && terminalInfo?.url && (
        <div>
          <p className="text-xs text-[var(--color-secondary)] opacity-35 tracking-widest mb-3">{t('link_side_project')}</p>
          <a
            href={terminalInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex items-center justify-between w-full border hover:bg-[var(--color-secondary)]/5 transition-all duration-300 ${cardPaddingClass} overflow-hidden cursor-pointer`}
            style={borderMid}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent opacity-25 group-hover:opacity-55 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-secondary)] to-transparent opacity-25 group-hover:opacity-55 transition-all duration-500"></div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-12 h-12 flex items-center justify-center border transition-colors duration-300 shrink-0" style={borderMid}>
                <i className="ri-terminal-box-line text-2xl text-[var(--color-accent)] group-hover:text-[var(--color-secondary)] transition-colors duration-300"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-secondary)] tracking-widest group-hover:text-[var(--color-primary)] transition-colors duration-300">
                  {content.pageMeta?.link?.terminalTitle || 'TERMINAL.STANN.KR'}
                </h3>
                <p className="text-xs text-[var(--color-secondary)] opacity-40 mt-1.5 group-hover:opacity-60 transition-all duration-300 leading-relaxed">
                  {terminalInfo.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[var(--color-secondary)] opacity-30 group-hover:opacity-70 transition-all duration-300 shrink-0 ml-4">
              <span className="text-xs tracking-widest hidden sm:block">{t('link_enter')}</span>
              <i className="ri-arrow-right-up-line text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"></i>
            </div>
          </a>
        </div>
      )}

      {/* Links Grid */}
      <div>
        <p className="text-xs text-[var(--color-secondary)] opacity-35 tracking-widest mb-3">{t('link_platforms')}</p>
        <div className={`grid ${gridColsClass} ${gridGapClass}`}>
          {linkPlatforms?.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden border ${cardPaddingClass} hover:bg-[var(--color-secondary)]/3 transition-all duration-300 cursor-pointer`}
              style={borderFaint}
            >
              <div className="relative space-y-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  <i className={`${link.icon} text-2xl text-[var(--color-accent)] group-hover:text-[var(--color-secondary)] transition-colors duration-300`}></i>
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-secondary)] tracking-widest group-hover:text-[var(--color-primary)] transition-colors duration-300">
                  {link.platform}
                </h3>
                <p className="text-xs text-[var(--color-secondary)] opacity-40 group-hover:opacity-60 transition-all duration-300 leading-relaxed">
                  {link.description}
                </p>
                <div className="flex items-center gap-2 text-[var(--color-secondary)] opacity-25 group-hover:opacity-60 transition-all duration-300">
                  <span className="text-xs tracking-widest">{t('link_visit')}</span>
                  <i className="ri-arrow-right-line text-xs group-hover:translate-x-1 transition-transform duration-300"></i>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-6 border-t" style={borderFaint}>
        <p className="text-xs text-[var(--color-secondary)] opacity-35 text-center">
          {t('link_footer_note')}{' '}
          <a href="/contact" className="text-[var(--color-secondary)] opacity-60 hover:opacity-100 transition-colors cursor-pointer underline underline-offset-4">
            {t('link_footer_contact')}
          </a>
          .
        </p>
      </div>
    </PageLayout>
  );
};

export default LinkPage;
