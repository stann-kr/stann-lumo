'use client';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderFaint } from '@/utils/colorMix';

export default function HomePage() {
  const { t } = useTranslation();
  const { content, displaySettings } = useContent();
  const settings = displaySettings.home;
  const borderFaint = createBorderFaint();

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
      <div className="space-y-10">
        {/* Navigation — 컴팩트 리스트 (배경 최소화로 3D 백그라운드 노출) */}
        <div>
          <p className="font-mono text-xs text-[var(--color-accent)] tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-[var(--color-accent)] animate-pulse"></span>
            {content.pageMeta?.home?.navTitle || t('home_nav_title')}
          </p>
          <div className="border" style={borderFaint}>
            {content.homeSections.map((section, index) => {
              const numStr = (index + 1).toString().padStart(2, '0');
              return (
                <Link
                  key={index}
                  href={section.path}
                  className="group flex items-center gap-4 px-4 py-3 border-b last:border-b-0 hover:bg-[var(--color-accent)]/5 transition-all duration-200 relative"
                  style={borderFaint}
                >
                  <span className="font-mono text-[9px] text-[var(--color-muted)] tracking-widest group-hover:text-[var(--color-accent)] transition-colors shrink-0">
                    [{numStr}]
                  </span>
                  <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-[var(--color-primary)] shrink-0">
                    {section.title}
                  </h2>
                  <p className="font-mono text-xs text-[var(--color-secondary)]/30 group-hover:text-[var(--color-secondary)]/60 transition-all flex-1 truncate hidden md:block">
                    {section.description}
                  </p>
                  <i className="ri-arrow-right-line text-xs text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Terminal Info */}
        {settings.showTerminalInfo && content.terminalInfo.url && (
          <div className="pt-8 space-y-6 relative before:absolute before:top-0 before:left-0 before:w-16 before:h-px before:bg-[var(--color-accent)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="font-mono text-[10px] tracking-widest text-[var(--color-accent)] uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--color-accent)]"></span>
                  {t('home_terminal_side_project')}
                </div>
                <p className="font-mono text-base leading-relaxed text-[var(--color-secondary)] opacity-60 max-w-2xl">
                  {content.terminalInfo.description}
                </p>
              </div>
              <a
                href={content.terminalInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-6 py-3 border border-[var(--color-accent)] text-sm font-mono tracking-widest text-[var(--color-accent)] whitespace-nowrap overflow-hidden transition-colors hover:text-white hover:bg-[var(--color-accent)]"
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
                  <div key={field.id} className="bg-surface p-4 flex flex-col justify-between space-y-2">
                    <p className="font-mono text-[10px] tracking-widest text-[var(--color-accent)] opacity-80 uppercase">
                      {field.fieldKey}
                    </p>
                    <div className="font-mono text-sm tracking-wider text-[var(--color-primary)] truncate">
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
