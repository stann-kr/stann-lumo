'use client';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import PageSection from '@/components/base/PageSection';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import { GAP_MAP, MD_GRID_COLS_MAP } from '@/utils/displaySettingsMap';

const AboutPage = () => {
  const { t } = useTranslation();
  const { content, displaySettings } = useContent();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const settings = displaySettings.about;
  const artistInfoItems = content.artistInfo ?? [];
  const sortedSections = [...(content.aboutSections ?? [])].sort((a, b) => a.order - b.order);

  const infoGapClass = GAP_MAP[settings.infoCardGap];
  const infoColsClass = MD_GRID_COLS_MAP[settings.infoGridColumns];

  return (
    <PageLayout title={t('about_title')} typingSpeed={settings.typingSpeed} spacing={settings.spacing}>
      {/* Artist Info Cards — 동적 key-value 렌더링 */}
      {artistInfoItems.length > 0 && (
        <div className={`grid grid-cols-2 ${infoColsClass} ${infoGapClass}`}>
          {artistInfoItems.map((info) => (
            <div key={info.id} className="p-4 border" style={borderFaint}>
              <p className="text-xs text-[var(--color-accent)] mb-2 tracking-widest">{info.key}</p>
              <p className="text-sm text-[var(--color-secondary)] font-medium">{info.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 동적 섹션 렌더링 */}
      {sortedSections.map((section) => (
        <PageSection key={section.id} title={section.title}>
          {section.type === 'paragraphs' && (
            <div className="space-y-4 text-[var(--color-secondary)] opacity-70 leading-relaxed text-sm">
              {(section.paragraphs ?? []).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          )}
          {section.type === 'philosophy-items' && (
            <div className="space-y-6">
              {(section.items ?? []).map((item) => (
                <div key={item.id}>
                  <blockquote
                    className="pl-4 border-l text-[var(--color-secondary)] opacity-80 italic text-base leading-relaxed mb-4"
                    style={borderMid}
                  >
                    {item.quote}
                  </blockquote>
                  <p className="text-sm text-[var(--color-secondary)] opacity-60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </PageSection>
      ))}
    </PageLayout>
  );
};

export default AboutPage;
