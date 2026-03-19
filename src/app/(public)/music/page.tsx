'use client';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import { PADDING_MAP, GAP_MAP } from '@/utils/displaySettingsMap';

const MusicPage = () => {
  const { t } = useTranslation();
  const { musicContent, content, displaySettings } = useContent();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const settings = displaySettings.music;
  const cardPaddingClass = PADDING_MAP[settings.cardPadding];
  const trackGapClass = GAP_MAP[settings.trackGap];

  return (
    <PageLayout
      title={content.pageMeta?.music?.title || t('music_title')}
      subtitle={content.pageMeta?.music?.subtitle || t('music_subtitle')}
      spacing={settings.spacing}
    >
      {/* Track List */}
      <div className={`grid ${trackGapClass}`}>
        {musicContent.tracks.map((track) => (
          <div
            key={track.id}
            className={`group border ${cardPaddingClass} transition-all duration-300`}
            style={borderFaint}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-[var(--color-secondary)] font-semibold text-base tracking-wide truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {track.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {settings.showTypeBadge && (
                    <span className="px-2 py-0.5 border text-[var(--color-accent)] tracking-wider" style={borderMid}>
                      {track.type}
                    </span>
                  )}
                  {settings.showDuration && (
                    <span className="text-[var(--color-secondary)] opacity-40">{track.duration}</span>
                  )}
                  {settings.showYear && (
                    <span className="text-[var(--color-secondary)] opacity-30">{track.year}</span>
                  )}
                </div>
              </div>

              <a
                href={track.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border text-[var(--color-secondary)] opacity-70 hover:opacity-100 hover:text-[var(--color-primary)] transition-all duration-200 text-xs tracking-widest font-medium whitespace-nowrap cursor-pointer"
                style={borderMid}
              >
                <i className="ri-play-circle-line text-base"></i>
                <span>{track.platform}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="pt-6 border-t" style={borderFaint}>
        <p className="text-xs text-[var(--color-secondary)] opacity-35 leading-relaxed">
          {t('music_note')}
        </p>
      </div>
    </PageLayout>
  );
};

export default MusicPage;
