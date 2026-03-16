import { useTranslation } from 'react-i18next';
import { useContent } from '../../contexts/ContentContext';
import PageLayout from '../../components/feature/PageLayout';
import PageSection from '../../components/base/PageSection';
import { createBorderFaint, createBorderMid } from '../../utils/colorMix';

const AboutPage = () => {
  const { t } = useTranslation();
  const { content } = useContent();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const artistInfoItems = content.artistInfo ?? [];

  return (
    <PageLayout currentView="ABOUT" title={t('about_title')} typingSpeed={60} spacing="lg">
      {/* Artist Info Cards — 동적 key-value 렌더링 */}
      {artistInfoItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {artistInfoItems.map((info) => (
            <div key={info.id} className="p-4 border" style={borderFaint}>
              <p className="text-xs text-[var(--color-accent)] mb-2 tracking-widest">{info.key}</p>
              <p className="text-sm text-[var(--color-secondary)] font-medium">{info.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Biography */}
      <PageSection title={t('about_section_biography')} icon="ri-user-line">
        <div className="space-y-4 text-[var(--color-secondary)] opacity-70 leading-relaxed text-sm">
          {(content.biography?.paragraphs ?? []).map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </PageSection>

      {/* Musical Philosophy — 동적 항목 렌더링 */}
      <PageSection title={t('about_section_philosophy')} icon="ri-music-2-line">
        <div className="space-y-6">
          {(content.musicalPhilosophy ?? []).map((item) => (
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
      </PageSection>

      {/* Design Philosophy — 동적 단락 렌더링 */}
      <PageSection title={t('about_section_design')} icon="ri-palette-line">
        <div className="p-6 border space-y-4" style={borderFaint}>
          {(content.designPhilosophy?.paragraphs ?? []).map((para, idx) => (
            <p key={idx} className="text-sm text-[var(--color-secondary)] opacity-65 leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </PageSection>
    </PageLayout>
  );
};

export default AboutPage;