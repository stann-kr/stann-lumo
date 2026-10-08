'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormSelect from '@/components/base/FormSelect';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import AdminEditorItem from '@/capabilities/admin/AdminEditorItem';
import collection from '@/capabilities/admin/AdminCollection.module.css';
import { useListEditor } from '@/capabilities/admin/useListEditor';
import { useItemReorder } from '@/capabilities/admin/useItemReorder';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useUnsavedChanges } from '@/capabilities/admin/useUnsavedChanges';
import { runSave } from '@/capabilities/admin/saveResult';
import { updateTracks, updatePageMeta } from '@/capabilities/content/contentAdmin.client';
import { hasKnownDuration, type Track, type PageMeta } from '@/capabilities/content/content';

const TRACK_TYPES = ['Original', 'Live Set', 'DJ Mix', 'Remix'];
const PLATFORMS = ['SoundCloud', 'Bandcamp', 'Spotify', 'Mixcloud', 'YouTube'];

export default function AdminMusicPage() {
  const { allContent, updateContent, currentEditLanguage, isLoading } = useContent();
  const content = allContent[currentEditLanguage];
  const { items: tracks, setItems: setTracks, updateItem: updateTrack, deleteItem: deleteTrack } = useListEditor<Track>(content.tracks);
  const { moveUp, moveDown } = useItemReorder(tracks, setTracks);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { setPageMeta(content.pageMeta); }, [content.pageMeta]);
  useEffect(() => { setQuery(''); setType('all'); setExpandedId(null); setDeleteId(null); }, [currentEditLanguage]);
  const { markSaved } = useUnsavedChanges({ pageMeta, tracks }, `${currentEditLanguage}:${isLoading}`);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const isFiltered = Boolean(normalizedQuery) || type !== 'all';
  const visibleTracks = tracks.map((track, index) => ({ track, index })).filter(({ track }) => {
    // Keep the selected editor stable while its searchable fields are being edited.
    const saved = content.tracks.find((item) => item.id === track.id) ?? track;
    return (type === 'all' || saved.type === type) &&
      `${saved.title} ${saved.platform} ${saved.year}`.toLocaleLowerCase().includes(normalizedQuery);
  });

  const addTrack = () => {
    const newTrack: Track = { id: crypto.randomUUID(), title: '', type: 'Original', duration: '', year: new Date().getFullYear().toString(), platform: 'SoundCloud', link: '' };
    setTracks([newTrack, ...tracks]);
    setQuery(''); setType('all'); setExpandedId(newTrack.id);
  };
  const updateTrackField = (index: number, field: keyof Track, value: string) => updateTrack(index, { ...tracks[index], [field]: value });
  const saveChanges = async () => {
    if (isSaving || isLoading) return;
    setIsSaving(true); setSaveError('');
    try {
      await runSave(['음악 목록', '페이지 문구'], [updateTracks(currentEditLanguage, tracks), updatePageMeta(currentEditLanguage, pageMeta)],
        () => { updateContent({ tracks, pageMeta }); markSaved(); showNotification(); },
        (failed) => setSaveError(`${failed.join(', ')} 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.`));
    } finally { setIsSaving(false); }
  };

  return <div className="space-y-8">
    <AdminSectionHeader title="음악" description="트랙과 믹스를 찾아 편집하고, 공개 순서를 바꿉니다."
      onSave={saveChanges} isSaving={isSaving} isSaveDisabled={isLoading}
      action={<button type="button" className={collection.button} disabled={isSaving || isLoading} onClick={addTrack}>음악 추가</button>} />
    <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
    <SaveErrorMessage message={saveError} />
    <fieldset disabled={isSaving || isLoading} className="space-y-8">
      <section aria-label="음악 목록">
        <div className={collection.toolbar}>
          <FormInput label="음악 검색" type="search" value={query} onChange={setQuery} placeholder="제목, 플랫폼, 연도" />
          <FormSelect label="종류" value={type} onChange={setType}>
            <option value="all">전체 종류</option>
            {Array.from(new Set([...TRACK_TYPES, ...tracks.map((track) => track.type)])).map((value) => <option key={value} value={value}>{value}</option>)}
          </FormSelect>
        </div>
        <p className={collection.count}>{visibleTracks.length} / {tracks.length}개</p>
        {isFiltered && <p className={collection.notice}>순서를 바꾸려면 검색과 종류 필터를 해제하세요.</p>}
        <div className={collection.list}>
          {visibleTracks.map(({ track, index }) => <AdminEditorItem key={track.id} title={track.title || '제목 없는 음악'}
            summary={[track.type, track.platform, track.year, hasKnownDuration(track.duration) && track.duration].filter(Boolean).join(' · ')} position={index + 1}
            expanded={expandedId === track.id} onToggle={() => setExpandedId(expandedId === track.id ? null : track.id)}
            onMoveUp={!isFiltered && index > 0 ? () => moveUp(index) : undefined}
            onMoveDown={!isFiltered && index < tracks.length - 1 ? () => moveDown(index) : undefined}
            onDelete={() => setDeleteId(track.id)}>
            <div className={collection.stack}>
              <div className={collection.fields}>
                <FormInput label="음악 제목" value={track.title} onChange={(value) => updateTrackField(index, 'title', value)} />
                <FormSelect label="음악 종류" value={track.type} onChange={(value) => updateTrackField(index, 'type', value)}>
                  {Array.from(new Set([...TRACK_TYPES, track.type])).map((value) => <option key={value} value={value}>{value}</option>)}
                </FormSelect>
                <FormInput label="재생 시간" value={track.duration} onChange={(value) => updateTrackField(index, 'duration', value)} placeholder="7:23" />
                <FormInput label="발표 연도" inputMode="numeric" value={track.year} onChange={(value) => updateTrackField(index, 'year', value)} />
                <FormSelect label="플랫폼" value={track.platform} onChange={(value) => updateTrackField(index, 'platform', value)}>
                  {Array.from(new Set([...PLATFORMS, track.platform])).map((value) => <option key={value} value={value}>{value}</option>)}
                </FormSelect>
                <FormInput label="재생 링크" type="url" value={track.link} onChange={(value) => updateTrackField(index, 'link', value)} placeholder="https://" />
              </div>
            </div>
          </AdminEditorItem>)}
        </div>
        {!visibleTracks.length && <div className={collection.empty}>
          <p>{tracks.length ? '조건에 맞는 음악이 없습니다.' : '아직 등록한 음악이 없습니다.'}</p>
          {isFiltered && <button type="button" onClick={() => { setQuery(''); setType('all'); }}>필터 초기화</button>}
        </div>}
      </section>
      <details className={collection.disclosure}><summary>페이지 문구</summary>
        <AdminCard><div className={collection.fields}>
          <FormInput label="페이지 제목" value={pageMeta.music.title} onChange={(title) => setPageMeta((prev) => ({ ...prev, music: { ...prev.music, title } }))} />
          <FormInput label="페이지 부제" value={pageMeta.music.subtitle} onChange={(subtitle) => setPageMeta((prev) => ({ ...prev, music: { ...prev.music, subtitle } }))} />
        </div></AdminCard>
      </details>
      {deleteId && <DeleteConfirmModal show itemName={tracks.find((track) => track.id === deleteId)?.title || '제목 없는 음악'}
        onConfirm={() => { const index = tracks.findIndex((track) => track.id === deleteId); if (index >= 0) deleteTrack(index); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />}
    </fieldset>
  </div>;
}
