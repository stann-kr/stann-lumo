'use client';
import { useState, useEffect, useRef } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormSelect from '@/components/base/FormSelect';
import FormTextarea from '@/components/base/FormTextarea';
import LoadingImage from '@/capabilities/media/LoadingImage';
import { getPublicImageUrl, MAX_UPLOAD_BYTES, POSTER_UPLOAD_TYPES } from '@/capabilities/media/media';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import AdminEditorItem from '@/capabilities/admin/AdminEditorItem';
import collection from '@/capabilities/admin/AdminCollection.module.css';
import styles from './page.module.css';
import { useListEditor } from '@/capabilities/admin/useListEditor';
import { useItemReorder } from '@/capabilities/admin/useItemReorder';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useUnsavedChanges } from '@/capabilities/admin/useUnsavedChanges';
import { updateTracks, updatePageMeta, uploadTrackCover, deleteTrackCover } from '@/capabilities/content/contentAdmin.client';
import { MAX_TRACKLIST_LENGTH } from '@/capabilities/content/trackMedia';
import { hasKnownDuration, type Track, type PageMeta } from '@/capabilities/content/content';

const TRACK_TYPES = ['Original', 'Live Set', 'DJ Mix', 'Remix'];
const PLATFORMS = ['SoundCloud', 'Bandcamp', 'Spotify', 'Mixcloud', 'YouTube'];
const CONFLICT_MESSAGE = '다른 탭이나 관리자가 음악 목록을 먼저 저장했습니다. 현재 입력은 유지됩니다. 최신 음악 목록을 불러온 뒤 다시 저장해 주세요.';

export default function AdminMusicPage() {
  const { allContent, updateContent, updateTrackMedia, currentEditLanguage, isLoading, retryContent } = useContent();
  const content = allContent[currentEditLanguage];
  const { items: tracks, setItems: setTracks, updateItem: updateTrack, deleteItem: deleteTrack } = useListEditor<Track>(content.tracks);
  const { moveUp, moveDown } = useItemReorder(tracks, setTracks);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // The stored list changed after this one was loaded; saving stays off until the latest list is loaded.
  const [hasConflict, setHasConflict] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [coverBusyId, setCoverBusyId] = useState<string | null>(null);
  const [coverMessage, setCoverMessage] = useState<{ id: string; text: string; error: boolean } | null>(null);
  // Search, filter and the open editor belong to one edit language. Reset them while rendering a new language rather
  // than in an effect: a mount-time effect also ran after the first render and closed an editor opened before it.
  const [listLanguage, setListLanguage] = useState(currentEditLanguage);
  if (listLanguage !== currentEditLanguage) {
    setListLanguage(currentEditLanguage);
    setQuery(''); setType('all'); setExpandedId(null); setDeleteId(null);
    setHasConflict(false); setSaveError('');
  }
  const listRef = useRef<HTMLElement>(null);
  // A cover change replaces the saved list, so nothing else may be edited or saved until it finishes.
  const isBusy = isSaving || isLoading || coverBusyId !== null;

  useEffect(() => { setPageMeta(content.pageMeta); }, [content.pageMeta]);
  // Covers are stored on upload, so they are not part of the unsaved list snapshot.
  const editableTracks = tracks.map((track) => ({ ...track, coverImageId: undefined }));
  const { isDirty, markSaved } = useUnsavedChanges({ pageMeta, tracks: editableTracks }, `${currentEditLanguage}:${isLoading}`);
  const savedIds = new Set(content.tracks.map((track) => track.id));
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
  const changeCover = async (trackId: string, file?: File) => {
    if (isDirty || !savedIds.has(trackId)) {
      setCoverMessage({ id: trackId, text: '음악 목록을 먼저 저장한 뒤 커버를 바꿔 주세요.', error: true });
      return;
    }
    if (file && (!POSTER_UPLOAD_TYPES.includes(file.type) || file.size > MAX_UPLOAD_BYTES)) {
      setCoverMessage({ id: trackId, text: 'JPG, PNG, WebP, AVIF, GIF 형식과 최대 10MB만 지원합니다.', error: true });
      return;
    }
    setCoverBusyId(trackId); setCoverMessage(null);
    try {
      const result = file ? await uploadTrackCover(trackId, file) : await deleteTrackCover(trackId);
      if (!result.success) throw new Error('cover');
      const coverImageId = file && result.data && typeof result.data === 'object' && 'coverImageId' in result.data ? result.data.coverImageId : undefined;
      // The cover belongs to the track in every language; patch only that field on the latest content.
      updateTrackMedia([{ id: trackId, coverImageId }]);
      setCoverMessage({ id: trackId, text: file ? '커버를 저장했습니다.' : '커버를 제거했습니다.', error: false });
    } catch {
      setCoverMessage({ id: trackId, text: '커버 변경에 실패했습니다. 다시 시도해 주세요.', error: true });
    } finally { setCoverBusyId(null); }
  };
  const saveChanges = async () => {
    if (isBusy || hasConflict) return;
    setIsSaving(true); setSaveError('');
    // Mix text is shared by both languages: send it only where it was edited here, so a stale copy cannot overwrite it.
    const saved = new Map(content.tracks.map((track) => [track.id, track]));
    const items = tracks.map((track) => {
      const before = saved.get(track.id);
      if (!before) return track;
      const item = { ...track };
      if ((track.tracklist ?? '') === (before.tracklist ?? '')) delete item.tracklist;
      if ((track.recordedOn ?? '') === (before.recordedOn ?? '')) delete item.recordedOn;
      return item;
    });
    // Page settings replace every page's text for this language, so send them only when they changed.
    const metaChanged = JSON.stringify(pageMeta) !== JSON.stringify(content.pageMeta);
    try {
      // The saved list is the base the server checks; it was loaded with this page or set by the last save.
      const [listResult, metaResult] = await Promise.allSettled([
        updateTracks(currentEditLanguage, items, content.tracks),
        metaChanged ? updatePageMeta(currentEditLanguage, pageMeta) : Promise.resolve({ success: true }),
      ]);
      const listResponse = listResult.status === 'fulfilled' ? listResult.value : null;
      const listSaved = Boolean(listResponse?.success);
      const metaSaved = metaResult.status === 'fulfilled' && metaResult.value.success;
      // Each part that was stored becomes the new saved state on its own, so the next save starts from it.
      if (listSaved) {
        updateContent({ tracks });
        updateTrackMedia(items.filter((item) => 'tracklist' in item || 'recordedOn' in item).map(({ id, ...media }) => ({
          id, ...('tracklist' in media && { tracklist: media.tracklist }), ...('recordedOn' in media && { recordedOn: media.recordedOn }),
        })));
        // A Korean list without rows of its own shows the English rows, so an English save can change it too.
        const otherLanguage = currentEditLanguage === 'en' ? 'ko' : 'en';
        const otherTracks = listResponse?.data?.tracks?.[otherLanguage];
        if (Array.isArray(otherTracks)) updateContent({ tracks: otherTracks }, otherLanguage);
      }
      if (metaChanged && metaSaved) updateContent({ pageMeta });
      if (listSaved && metaSaved) {
        markSaved(); showNotification();
        return;
      }
      const conflict = !listSaved && listResponse?.error?.code === 'CONFLICT';
      const failed = [!listSaved && !conflict && '음악 목록', !metaSaved && '페이지 문구'].filter(Boolean);
      setHasConflict(conflict);
      setSaveError([conflict && CONFLICT_MESSAGE,
        failed.length > 0 && `${failed.join(', ')} 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.`].filter(Boolean).join(' '));
    } finally { setIsSaving(false); }
  };
  const reloadLatest = () => {
    if (!window.confirm('저장하지 않은 음악 목록과 페이지 문구 편집을 버리고 최신 내용을 불러올까요?')) return;
    // Reloads both languages; the page opens again from the stored lists.
    retryContent();
  };

  return <div className="space-y-8">
    <AdminSectionHeader title="음악" description="트랙과 믹스를 찾아 편집하고, 공개 순서를 바꿉니다."
      onSave={saveChanges} isSaving={isSaving} isSaveDisabled={isLoading || coverBusyId !== null || hasConflict}
      action={<button type="button" className={collection.button} disabled={isBusy} onClick={addTrack}>음악 추가</button>} />
    <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
    <SaveErrorMessage message={saveError} />
    {hasConflict && <button type="button" className={collection.button} onClick={reloadLatest}>최신 음악 목록 불러오기 (현재 음악 편집 버림)</button>}
    <fieldset disabled={isBusy} className="space-y-8">
      <section ref={listRef} tabIndex={-1} aria-label="음악 목록">
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
                <FormInput label="녹음 날짜" type="date" value={track.recordedOn ?? ''} onChange={(value) => updateTrackField(index, 'recordedOn', value)} />
              </div>
              <FormTextarea label="트랙리스트 (한 줄에 한 곡)" rows={8} maxLength={MAX_TRACKLIST_LENGTH} value={track.tracklist ?? ''}
                onChange={(value) => updateTrackField(index, 'tracklist', value)} placeholder={'Artist — Title\nArtist — Title'} />
              <div className={styles.cover}>
                <div className={styles.coverFrame}>
                  {track.coverImageId ? <LoadingImage src={getPublicImageUrl(track.coverImageId, 640)} alt="" quiet /> : <span>커버<br />없음</span>}
                </div>
                <div className={styles.coverBody}>
                  <p className={styles.coverHint}>{savedIds.has(track.id) ? '커버는 올리는 즉시 공개 화면에 반영됩니다. 정사각형 이미지, 최대 10MB.' : '새 음악은 먼저 저장한 뒤 커버를 올릴 수 있습니다.'}</p>
                  <div className={styles.coverActions}>
                    <label className={collection.button} data-disabled={coverBusyId !== null || isDirty || !savedIds.has(track.id)}>
                      {coverBusyId === track.id ? '처리 중…' : track.coverImageId ? '커버 교체' : '커버 업로드'}
                      <input type="file" className="sr-only" accept={POSTER_UPLOAD_TYPES.join(',')} aria-label={`${track.title || '제목 없는 음악'} 커버 ${track.coverImageId ? '교체' : '업로드'}`}
                        disabled={coverBusyId !== null || isDirty || !savedIds.has(track.id)}
                        onChange={(event) => { const file = event.target.files?.[0]; if (file) void changeCover(track.id, file); event.target.value = ''; }} />
                    </label>
                    {track.coverImageId && <button type="button" className={collection.dangerButton} disabled={coverBusyId !== null || isDirty} onClick={() => void changeCover(track.id)}>커버 제거</button>}
                  </div>
                  {coverMessage?.id === track.id && <p role={coverMessage.error ? 'alert' : 'status'} className={styles.coverHint}>{coverMessage.text}</p>}
                </div>
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
      {deleteId && <DeleteConfirmModal show itemName={tracks.find((track) => track.id === deleteId)?.title || '제목 없는 음악'} returnFocusRef={listRef}
        onConfirm={() => { const index = tracks.findIndex((track) => track.id === deleteId); if (index >= 0) deleteTrack(index); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />}
    </fieldset>
  </div>;
}
