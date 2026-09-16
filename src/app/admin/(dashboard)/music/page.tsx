'use client';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormSelect from '@/components/base/FormSelect';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useListEditor } from '@/capabilities/admin/useListEditor';
import { useDeleteConfirm } from '@/capabilities/admin/useDeleteConfirm';
import { useItemReorder } from '@/capabilities/admin/useItemReorder';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useUnsavedChanges } from '@/capabilities/admin/useUnsavedChanges';
import { useState, useEffect } from 'react';
import { createBorderFaint } from '@/utils/colorMix';
import { runSave } from '@/capabilities/admin/saveResult';
import {
  updateTracks as apiUpdateTracks,
  updatePageMeta as apiUpdatePageMeta,
} from '@/capabilities/content/contentAdmin.client';
import type { PageMeta } from '@/capabilities/content/content';

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
  const { allContent, updateContent, currentEditLanguage, isLoading } = useContent();
  const content = allContent[currentEditLanguage];

  const {
    items: tracks,
    setItems: setTracks,
    updateItem: updateTrack,
    deleteItem: deleteTrack,
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
  const [saveError, setSaveError] = useState('');
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);

  useEffect(() => {
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  const { markSaved } = useUnsavedChanges(
    { pageMeta, tracks },
    `${currentEditLanguage}:${isLoading}`,
  );

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
    setTracks([newTrack, ...tracks]);
  };

  const updateTrackField = (index: number, field: keyof Track, value: string) => {
    updateTrack(index, { ...tracks[index], [field]: value });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await runSave(
        ['TRACKS', 'PAGE SETTINGS'],
        [
          apiUpdateTracks(currentEditLanguage, tracks),
          apiUpdatePageMeta(currentEditLanguage, pageMeta),
        ],
        () => {
          updateContent({ tracks, pageMeta });
          markSaved();
          showNotification();
        },
        (failedAreas) => {
          setSaveError(`${failedAreas.join(', ')} 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.`);
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
        <AdminSectionHeader
          title="음악"
          description="트랙과 릴리즈를 관리합니다."
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
        <SaveErrorMessage message={saveError} />

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
                      <FormSelect
                        id={`track-type-${track.id}`}
                        name={`trackType-${track.id}`}
                        label="TYPE"
                          value={track.type}
                        onChange={(value) => updateTrackField(index, 'type', value)}
                        >
                          <option value="Original">Original</option>
                          <option value="Live Set">Live Set</option>
                          <option value="DJ Mix">DJ Mix</option>
                          <option value="Remix">Remix</option>
                      </FormSelect>
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
                      <FormSelect
                        id={`track-platform-${track.id}`}
                        name={`trackPlatform-${track.id}`}
                        label="PLATFORM"
                          value={track.platform}
                        onChange={(value) => updateTrackField(index, 'platform', value)}
                        >
                          <option value="SoundCloud">SoundCloud</option>
                          <option value="Bandcamp">Bandcamp</option>
                          <option value="Spotify">Spotify</option>
                          <option value="Mixcloud">Mixcloud</option>
                          <option value="YouTube">YouTube</option>
                      </FormSelect>
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
                        type="button"
                        onClick={() => openDeleteConfirm(index)}
                        aria-label={`트랙 ${track.title} 삭제`}
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
