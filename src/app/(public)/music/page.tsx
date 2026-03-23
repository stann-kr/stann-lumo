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
      {/* Track List - Database Log Style */}
      <div className="border border-[var(--color-muted)] bg-[var(--color-muted)] p-[1px] flex flex-col gap-[1px]">
        {/* Header Row */}
        <div className="hidden md:flex items-center px-4 py-2 bg-[var(--color-bg)] font-mono text-[9px] tracking-widest text-[var(--color-accent)] uppercase">
          <div className="w-16">ID</div>
          <div className="flex-1">TRACK_TITLE</div>
          <div className="w-24">TYPE</div>
          <div className="w-20">DUR</div>
          <div className="w-16">YR</div>
          <div className="w-32 text-right">ACTION</div>
        </div>

        {musicContent.tracks.map((track, idx) => {
          const idStr = (idx + 1).toString().padStart(3, '0');
          return (
            <div
              key={track.id}
              className="group bg-[var(--color-bg)] relative overflow-hidden transition-colors hover:bg-[var(--color-accent)]/5 flex flex-col md:flex-row md:items-center px-4 py-4 md:py-3 gap-3 md:gap-0"
            >
              <div className="w-16 font-mono text-[10px] text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors hidden md:block">
                {idStr}
              </div>
              
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 md:hidden mb-2">
                  <span className="font-mono text-[9px] text-[var(--color-accent)]">[{idStr}]</span>
                </div>
                <h3 className="font-mono text-sm tracking-widest text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors uppercase truncate">
                  {track.title}
                </h3>
              </div>
              
              <div className="w-24 font-mono text-[10px] tracking-widest text-[var(--color-secondary)] opacity-60">
                {settings.showTypeBadge && `[${track.type}]`}
              </div>
              
              <div className="w-20 font-mono text-[10px] tracking-widest text-[var(--color-secondary)] opacity-40">
                {settings.showDuration && track.duration}
              </div>
              
              <div className="w-16 font-mono text-[10px] tracking-widest text-[var(--color-secondary)] opacity-30">
                {settings.showYear && track.year}
              </div>
              
              <div className="w-32 md:text-right mt-2 md:mt-0">
                <a
                  href={track.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[var(--color-muted)] px-3 py-1 font-mono text-[10px] tracking-widest text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all duration-300"
                >
                  <i className="ri-play-fill text-xs"></i>
                  {track.platform.toUpperCase()}
                </a>
              </div>
            </div>
          );
        })}
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
