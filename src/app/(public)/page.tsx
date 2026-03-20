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
          <div className={`grid grid-cols-1 ${navColsClass} ${navGapClass}`}>
            {content.homeSections.map((section, index) => (
              <Link
                key={index}
                href={section.path}
                className={`group border transition-all duration-300 cursor-pointer ${navPaddingClass}`}
                style={borderFaint}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'color-mix(in srgb, var(--color-accent) 50%, transparent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'color-mix(in srgb, var(--color-secondary) 15%, transparent)';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <i
                          className={`${section.icon} text-xl`}
                          style={{ color: 'var(--color-accent)' }}
                        />
                      </div>
                      <h2
                        className="text-base font-semibold tracking-widest"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {section.title}
                      </h2>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-secondary)', opacity: 0.55 }}
                    >
                      {section.description}
                    </p>
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center ml-3 mt-1">
                    <i
                      className="ri-arrow-right-line text-base transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: 'var(--color-accent)', opacity: 0.6 }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </PageSection>

        {/* Terminal Info */}
        {settings.showTerminalInfo && content.terminalInfo.url && (
          <div className="pt-8 border-t space-y-6" style={borderMid}>
            {/* 헤더 행: 설명 + 링크 버튼 */}
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <p
                  className="text-xs tracking-widest"
                  style={{ color: 'var(--color-accent)', opacity: 0.7 }}
                >
                  {t('home_terminal_side_project')}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-secondary)', opacity: 0.6 }}
                >
                  {content.terminalInfo.description}
                </p>
              </div>
              <a
                href={content.terminalInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 border text-sm tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
                  color: 'var(--color-accent)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'color-mix(in srgb, var(--color-accent) 10%, transparent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {t('home_terminal_enter')} →
              </a>
            </div>

            {/* 커스텀 필드 */}
            {content.terminalInfo.customFields && content.terminalInfo.customFields.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                {content.terminalInfo.customFields.map((field) => (
                  <div key={field.id} className="space-y-0.5">
                    <p className="text-[10px] tracking-widest" style={{ color: 'var(--color-accent)', opacity: 0.6 }}>
                      {field.fieldKey.toUpperCase()}
                    </p>
                    {field.fieldType === 'url' ? (
                      <a
                        href={field.fieldValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs tracking-wider underline underline-offset-2"
                        style={{ color: 'var(--color-secondary)', opacity: 0.7 }}
                      >
                        {field.fieldValue}
                      </a>
                    ) : field.fieldType === 'badge' ? (
                      <span
                        className="inline-block text-[10px] tracking-widest px-2 py-0.5 border"
                        style={{
                          borderColor: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {field.fieldValue}
                      </span>
                    ) : (
                      <p className="text-xs tracking-wider" style={{ color: 'var(--color-secondary)', opacity: 0.7 }}>
                        {field.fieldValue}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 임베드 */}
            {content.terminalInfo.style?.showEmbed && (
              <div className="border" style={borderFaint}>
                <iframe
                  src={content.terminalInfo.url}
                  style={{ width: '100%', height: content.terminalInfo.style.embedHeight, border: 'none' }}
                  title="Terminal"
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
