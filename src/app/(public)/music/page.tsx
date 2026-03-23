'use client';
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import { createBorderFaint } from '@/utils/colorMix';
const MusicPage = () => {
  const { t } = useTranslation();
  const { musicContent, content } = useContent();
  const borderFaint = createBorderFaint();

  return (
    <PageLayout
      title={content.pageMeta?.music?.title || t('music_title')}
      subtitle={content.pageMeta?.music?.subtitle || t('music_subtitle')}
    >
      {/* Track List - Database Log Style */}
      <div className="hud-panel flex flex-col">
        {/* Header Row */}
        <div className="hidden md:flex items-center px-4 py-2 border-b border-[var(--color-muted)]/30 font-mono text-[10px] tracking-widest text-[var(--color-accent)] uppercase">
          <div className="w-16">{t('music_col_id')}</div>
          <div className="flex-1">{t('music_col_title')}</div>
          <div className="w-24">{t('music_col_type')}</div>
          <div className="w-20">{t('music_col_dur')}</div>
          <div className="w-16">{t('music_col_yr')}</div>
          <div className="w-32 text-right">{t('music_col_action')}</div>
        </div>

        {musicContent.tracks.map((track, idx) => {
          const idStr = (idx + 1).toString().padStart(3, '0');
          return (
            <div
              key={track.id}
              className="group relative overflow-hidden border-b border-[var(--color-muted)]/20 last:border-b-0 transition-colors hover:bg-[var(--color-accent)]/5 flex flex-col md:flex-row md:items-center px-4 py-4 md:py-3 gap-3 md:gap-0"
            >
              <div className="w-16 font-mono text-xs text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors hidden md:block">
                {idStr}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 md:hidden mb-2">
                  <span className="font-mono text-[10px] text-[var(--color-accent)]">[{idStr}]</span>
                </div>
                <h3 className="font-mono text-base tracking-widest text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors uppercase truncate">
                  {track.title}
                </h3>
              </div>

              <div className="w-24 font-mono text-xs tracking-widest text-[var(--color-secondary)] opacity-60">
                {`[${track.type}]`}
              </div>

              <div className="w-20 font-mono text-xs tracking-widest text-[var(--color-secondary)] opacity-40">
                {track.duration}
              </div>

              <div className="w-16 font-mono text-xs tracking-widest text-[var(--color-secondary)] opacity-30">
                {track.year}
              </div>

              <div className="w-32 md:text-right mt-2 md:mt-0">
                <a
                  href={track.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border px-3 py-1 font-mono text-xs tracking-widest text-[var(--color-secondary)] opacity-50 hover:opacity-100 hover:bg-[var(--color-accent)]/10 transition-all duration-300"
                  style={borderFaint}
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
        <p className="text-sm text-[var(--color-secondary)] opacity-35 leading-relaxed">
          {t('music_note')}
        </p>
      </div>
    </PageLayout>
  );
};

export default MusicPage;
