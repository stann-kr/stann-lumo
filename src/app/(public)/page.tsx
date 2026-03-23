'use client';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import PageSection from '@/components/base/PageSection';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import { PADDING_MAP, GAP_MAP, MD_GRID_COLS_MAP } from '@/utils/displaySettingsMap';

export default function HomePage() {
  const { t } = useTranslation();
  const { content, displaySettings } = useContent();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const settings = displaySettings.home;
  const navColsClass = MD_GRID_COLS_MAP[settings.navGridColumns];
  const navGapClass = GAP_MAP[settings.navGridGap];
  const navPaddingClass = PADDING_MAP[settings.navCardPadding];

  const artistName = Array.isArray(content.artistInfo)
    ? (content.artistInfo.find((item) => item.key === 'Name' || item.key === '이름')?.value ?? '')
    : '';
  const nameParts = artistName.includes('&')
    ? artistName.split('&').map((s) => s.trim())
    : artistName.split(' ').map((s) => s.trim()).filter(Boolean);

  return (
    <PageLayout
      title={nameParts[0] ?? artistName}
      titleExtra={nameParts.slice(1)}
    >
      <div className="space-y-12">
        {/* Navigation Grid */}
        <PageSection title={content.pageMeta?.home?.navTitle || t('home_nav_title') || 'NAVIGATION'} icon="ri-compass-3-line">
          <div className={`grid grid-cols-1 ${navColsClass} gap-px bg-[var(--color-muted)] border border-[var(--color-muted)] p-[1px]`}>
            {content.homeSections.map((section, index) => {
              const numStr = (index + 1).toString().padStart(2, '0');
              return (
                <Link
                  key={index}
                  href={section.path}
                  className={`group bg-[var(--color-bg)] relative overflow-hidden transition-all duration-300 cursor-pointer ${navPaddingClass}`}
                >
                  {/* Hover Scanline Effect */}
                  <div className="absolute inset-0 bg-[var(--color-accent)] opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-[10px] text-[var(--color-muted)] tracking-widest group-hover:text-[var(--color-accent)] transition-colors">
                          [{numStr}]
                        </div>
                        <h2 className="text-base font-mono uppercase tracking-[0.2em] text-[var(--color-primary)]">
                          {section.title}
                        </h2>
                      </div>
                      <p className="font-mono text-xs leading-relaxed text-[var(--color-secondary)] opacity-50 group-hover:opacity-80 transition-opacity">
                        {section.description}
                      </p>
                    </div>
                    
                    <div className="w-8 h-8 flex items-center justify-center border border-[var(--color-muted)] group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent)]/10 transition-all duration-300">
                      <i className="ri-arrow-right-line text-sm text-[var(--color-muted)] group-hover:text-[var(--color-accent)]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </PageSection>

        {/* Terminal Info */}
        {settings.showTerminalInfo && content.terminalInfo.url && (
          <div className="pt-8 space-y-6 relative before:absolute before:top-0 before:left-0 before:w-16 before:h-px before:bg-[var(--color-accent)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="font-mono text-[10px] tracking-widest text-[var(--color-accent)] uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--color-accent)]"></span>
                  {t('home_terminal_side_project')}
                </div>
                <p className="font-mono text-sm leading-relaxed text-[var(--color-secondary)] opacity-60 max-w-2xl">
                  {content.terminalInfo.description}
                </p>
              </div>
              <a
                href={content.terminalInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-6 py-3 border border-[var(--color-accent)] text-xs font-mono tracking-widest text-[var(--color-accent)] whitespace-nowrap overflow-hidden transition-colors hover:text-white hover:bg-[var(--color-accent)]"
              >
                <div className="absolute inset-0 bg-[var(--color-accent)]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {t('home_terminal_enter')} <i className="ri-arrow-right-up-line"></i>
                </span>
              </a>
            </div>

            {/* Custom Fields */}
            {content.terminalInfo.customFields && content.terminalInfo.customFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[var(--color-muted)] border border-[var(--color-muted)] p-[1px]">
                {content.terminalInfo.customFields.map((field) => (
                  <div key={field.id} className="bg-[var(--color-bg)] p-4 flex flex-col justify-between space-y-2">
                    <p className="font-mono text-[9px] tracking-widest text-[var(--color-accent)] opacity-80 uppercase">
                      {field.fieldKey}
                    </p>
                    <div className="font-mono text-xs tracking-wider text-[var(--color-primary)] truncate">
                      {field.fieldType === 'url' ? (
                        <a href={field.fieldValue} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] hover:underline transition-colors">
                          {field.fieldValue}
                        </a>
                      ) : field.fieldType === 'badge' ? (
                        <span className="inline-block border border-[var(--color-accent)] px-2 py-0.5 text-[var(--color-accent)]">
                          {field.fieldValue}
                        </span>
                      ) : (
                        <span>{field.fieldValue}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Embed */}
            {content.terminalInfo.style?.showEmbed && (
              <div className="hud-panel p-1">
                <iframe
                  src={content.terminalInfo.url}
                  style={{ width: '100%', height: content.terminalInfo.style.embedHeight, border: 'none' }}
                  title="Terminal"
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                  className="bg-black filter grayscale opacity-90 transition-all hover:grayscale-0 hover:opacity-100"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
