'use client';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import SuccessMessage from '@/components/base/SuccessMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import RadioGroup from '@/components/base/RadioGroup';
import { useListEditor } from '@/hooks/useListEditor';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useItemReorder } from '@/hooks/useItemReorder';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { useState, useEffect } from 'react';
import { createBorderFaint } from '@/utils/colorMix';
import {
  updateTracks as apiUpdateTracks,
  updatePageMeta as apiUpdatePageMeta,
  fetchDisplaySettings,
  updateDisplaySettings,
} from '@/services/adminService';
import type { PageMeta } from '@/types/content';
import type { MusicDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';

interface Track {
  id: string;
  title: string;
  type: string;
  duration: string;
  year: string;
  platform: string;
  link: string;
}

const AdminMusicPage = () => {
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];

  const {
    items: tracks,
    setItems: setTracks,
    updateItem: updateTrack,
    deleteItem: deleteTrack,
    addItem: addTrack,
  } = useListEditor<Track>(content.tracks);

  const {
    isOpen: isDeleteModalOpen,
    pendingIndex: deleteIndex,
    openConfirm: openDeleteConfirm,
    closeConfirm: closeDeleteConfirm,
    confirmDelete,
  } = useDeleteConfirm();

  const { moveUp, moveDown } = useItemReorder(tracks, setTracks);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [displaySettings, setDisplaySettings] = useState<MusicDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.music
  );

  useEffect(() => {
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  useEffect(() => {
    fetchDisplaySettings('music').then((res) => {
      if (res.success && res.data) {
        setDisplaySettings(res.data as MusicDisplaySettings);
      }
    });
  }, []);

  const updatePageMetaField = (field: keyof PageMeta['music'], value: string) => {
    setPageMeta(prev => ({ ...prev, music: { ...prev.music, [field]: value } }));
  };

  const addNewTrack = () => {
    const newTrack: Track = {
      id: crypto.randomUUID(),
      title: 'New Track',
      type: 'Original',
      duration: '0:00',
      year: new Date().getFullYear().toString(),
      platform: 'SoundCloud',
      link: 'https://',
    };
    addTrack(newTrack);
  };

  const updateTrackField = (index: number, field: keyof Track, value: string) => {
    updateTrack(index, { ...tracks[index], [field]: value });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    await Promise.allSettled([
      apiUpdateTracks(currentEditLanguage, tracks),
      apiUpdatePageMeta(currentEditLanguage, pageMeta),
      updateDisplaySettings('music', displaySettings),
    ]);
    updateContent({ tracks, pageMeta });
    showNotification();
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
        <AdminSectionHeader
          title="MUSIC SECTION"
          description={`트랙, 릴리즈, 오디오 작업 관리 (${currentEditLanguage.toUpperCase()})`}
          onSave={saveChanges}
          isSaving={isSaving}
          action={
            <button
              onClick={addNewTrack}
              className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider"
              style={createBorderFaint()}
            >
              <i className="ri-add-line mr-2"></i>ADD TRACK
            </button>
          }
        />

        <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />

        {/* DISPLAY SETTINGS */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            DISPLAY SETTINGS
          </h2>
          <AdminCard>
            <div className="space-y-6">
              <RadioGroup
                label="SECTION SPACING"
                value={displaySettings.spacing}
                options={[
                  { value: 'sm', label: 'SM' },
                  { value: 'md', label: 'MD' },
                  { value: 'lg', label: 'LG' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, spacing: v }))}
              />
              <RadioGroup
                label="CARD PADDING"
                value={displaySettings.cardPadding}
                options={[
                  { value: 'sm', label: 'SM' },
                  { value: 'md', label: 'MD' },
                  { value: 'lg', label: 'LG' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, cardPadding: v }))}
              />
              <RadioGroup
                label="TRACK GAP"
                value={displaySettings.trackGap}
                options={[
                  { value: 'sm', label: 'SM' },
                  { value: 'md', label: 'MD' },
                  { value: 'lg', label: 'LG' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, trackGap: v }))}
              />
              <div className="flex flex-wrap gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySettings.showDuration}
                    onChange={(e) => setDisplaySettings((prev) => ({ ...prev, showDuration: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                  />
                  <span className="text-xs text-[var(--color-secondary)] tracking-widest">SHOW DURATION</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySettings.showYear}
                    onChange={(e) => setDisplaySettings((prev) => ({ ...prev, showYear: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                  />
                  <span className="text-xs text-[var(--color-secondary)] tracking-widest">SHOW YEAR</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySettings.showTypeBadge}
                    onChange={(e) => setDisplaySettings((prev) => ({ ...prev, showTypeBadge: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                  />
                  <span className="text-xs text-[var(--color-secondary)] tracking-widest">SHOW TYPE BADGE</span>
                </label>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* PAGE SETTINGS */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            PAGE SETTINGS
          </h2>
          <AdminCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="PAGE TITLE"
                value={pageMeta.music.title}
                onChange={(value) => updatePageMetaField('title', value)}
                placeholder="MUSIC"
              />
              <FormInput
                label="PAGE SUBTITLE"
                value={pageMeta.music.subtitle}
                onChange={(value) => updatePageMetaField('subtitle', value)}
                placeholder="TRACKS & MIXES"
              />
            </div>
          </AdminCard>
        </div>

        <div className="space-y-4">
          {tracks.map((track, index) => (
            <AdminCard key={track.id}>
              {isDeleteModalOpen && deleteIndex === index ? (
                <DeleteConfirmModal
                  show={true}
                  itemName={deleteIndex !== null ? tracks[deleteIndex]?.title || '' : ''}
                  onConfirm={() => confirmDelete(deleteTrack)}
                  onCancel={closeDeleteConfirm}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="TITLE"
                        value={track.title}
                        onChange={(value) => updateTrackField(index, 'title', value)}
                      />
                      <div>
                        <label className="block text-xs text-[var(--color-accent)] tracking-widest mb-2">TYPE</label>
                        <select
                          value={track.type}
                          onChange={(e) => updateTrackField(index, 'type', e.target.value)}
                          className="w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                        >
                          <option value="Original">Original</option>
                          <option value="Live Set">Live Set</option>
                          <option value="DJ Mix">DJ Mix</option>
                          <option value="Remix">Remix</option>
                        </select>
                      </div>
                      <FormInput
                        label="DURATION"
                        value={track.duration}
                        onChange={(value) => updateTrackField(index, 'duration', value)}
                        placeholder="7:23"
                      />
                      <FormInput
                        label="YEAR"
                        value={track.year}
                        onChange={(value) => updateTrackField(index, 'year', value)}
                      />
                      <div>
                        <label className="block text-xs text-[var(--color-accent)] tracking-widest mb-2">PLATFORM</label>
                        <select
                          value={track.platform}
                          onChange={(e) => updateTrackField(index, 'platform', e.target.value)}
                          className="w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                        >
                          <option value="SoundCloud">SoundCloud</option>
                          <option value="Bandcamp">Bandcamp</option>
                          <option value="Spotify">Spotify</option>
                          <option value="Mixcloud">Mixcloud</option>
                          <option value="YouTube">YouTube</option>
                        </select>
                      </div>
                      <FormInput
                        label="LINK"
                        value={track.link}
                        onChange={(value) => updateTrackField(index, 'link', value)}
                      />
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        style={createBorderFaint()}
                        title="Move up"
                      >
                        <i className="ri-arrow-up-line"></i>
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === tracks.length - 1}
                        className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        style={createBorderFaint()}
                        title="Move down"
                      >
                        <i className="ri-arrow-down-line"></i>
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(index)}
                        className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
    </div>
  );
};

export default AdminMusicPage;
