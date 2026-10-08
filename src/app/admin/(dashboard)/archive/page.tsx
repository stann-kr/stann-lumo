'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormSelect from '@/components/base/FormSelect';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useDeleteConfirm } from '@/capabilities/admin/useDeleteConfirm';
import { useAdminEditGuard } from '@/capabilities/admin/AdminEditGuard';
import collection from '@/capabilities/admin/AdminCollection.module.css';
import styles from '@/capabilities/media/MediaEditor.module.css';
import { createBorderFaint } from '@/utils/colorMix';
import { runSave } from '@/capabilities/admin/saveResult';
import type { Performance } from '@/capabilities/events/events';
import { fetchPerformances } from '@/capabilities/events/eventsAdmin.client';
import { extractYouTubeId, getPublicImageUrl, type GalleryPhoto } from '@/capabilities/media/media';
import LoadingImage from '@/capabilities/media/LoadingImage';
import {
  addYouTubeGalleryVideo,
  deleteGalleryPhoto,
  fetchGalleryPhotos,
  updateGalleryPhotos,
  uploadGalleryFiles,
} from '@/capabilities/media/mediaAdmin.client';

// ─── FocalPicker ─────────────────────────────────────────────────────────────
interface FocalPickerProps {
  photoId: string;
  focalX: number;
  focalY: number;
  onFocalChange: (x: number, y: number) => void;
}
function FocalPicker({ photoId, focalX, focalY, onFocalChange }: FocalPickerProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) { onFocalChange(50, 50); return; }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      onFocalChange(
        Math.max(0, Math.min(100, x)),
        Math.max(0, Math.min(100, y)),
      );
    },
    [onFocalChange],
  );

  return (
    <button
      type="button"
      aria-label={`이미지 초점 ${focalX}%, ${focalY}%. 방향키로 조절, Enter로 중앙 정렬`}
      onKeyDown={(event) => {
        const delta = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }[event.key];
        if (!delta) return;
        event.preventDefault();
        onFocalChange(Math.max(0, Math.min(100, focalX + delta[0])), Math.max(0, Math.min(100, focalY + delta[1])));
      }}
      className="relative w-24 h-24 shrink-0 overflow-hidden border cursor-crosshair"
      style={createBorderFaint()}
      onClick={handleClick}
      title="클릭하여 포컬 포인트 설정"
    >
      <img
        src={getPublicImageUrl(photoId)}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: `${focalX}% ${focalY}%` }}
        loading="lazy"
        draggable={false}
      />
      {/* 포컬 마커 */}
      <div
        className="absolute w-3 h-3 border-2 border-[var(--color-accent)] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${focalX}%`, top: `${focalY}%` }}
      />
    </button>
  );
}

// ─── 이벤트 선택 셀렉트 ──────────────────────────────────────────────────────
interface EventSelectProps {
  value: string;
  performances: Performance[];
  onChange: (eventId: string) => void;
  label?: string;
}
function EventSelect({ value, performances, onChange, label = '연결된 공연' }: EventSelectProps) {
  return (
      <FormSelect
        label={label}
        value={value}
        onChange={onChange}
      >
        <option value="">— 없음 —</option>
        {performances.map((p) => (
          <option key={p.id} value={p.id}>
            {p.date} · {p.title}
          </option>
        ))}
      </FormSelect>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
const AdminGalleryPage = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<GalleryPhoto[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [performances, setPerformances] = useState<Performance[]>([]);

  // YouTube 입력
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubePreviewId, setYoutubePreviewId] = useState<string | null>(null);
  const [youtubeLinkedEventId, setYoutubeLinkedEventId] = useState('');
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');
  const { setDirty } = useAdminEditGuard();
  const hasPhotoEdits = JSON.stringify(photos) !== JSON.stringify(savedPhotos);
  const controlsDisabled = isLoading || isSaving || isUploading || isAddingYoutube || isDeleting || Boolean(loadError);
  const hasDraft = hasPhotoEdits || Boolean(youtubeUrl.trim()) || Boolean(youtubeLinkedEventId);
  useEffect(() => { setDirty(hasDraft); }, [hasDraft, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();
  const { isOpen: isDeleteModalOpen, pendingIndex: deleteIndex, openConfirm, closeConfirm, confirmDelete } = useDeleteConfirm();

  // ─── 초기 데이터 로드 ────────────────────────────────────────────────────
  const fetchData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [photosResult, performancesResult] = await Promise.all([
        fetchGalleryPhotos(),
        fetchPerformances(),
      ]);
      if (!photosResult.success || !photosResult.data || !performancesResult.success || !performancesResult.data) throw new Error('load');
      setPhotos(photosResult.data);
      setSavedPhotos(photosResult.data);
      setPerformances(performancesResult.data);
    } catch {
      setLoadError('미디어 목록을 불러오지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── YouTube URL 실시간 파싱 ─────────────────────────────────────────────
  useEffect(() => {
    setYoutubePreviewId(extractYouTubeId(youtubeUrl));
    setYoutubeError('');
  }, [youtubeUrl]);


  // ─── 사진 메타 필드 업데이트 ─────────────────────────────────────────────
  const updatePhotoField = (index: number, field: keyof Pick<GalleryPhoto, 'altText' | 'caption' | 'linkedEventId'>, value: string) => {
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, [field]: field === 'linkedEventId' ? value || undefined : value } : p));
  };

  // ─── 포컬 포인트 업데이트 ───────────────────────────────────────────────
  const updateFocal = (index: number, x: number, y: number) => {
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, focalX: x, focalY: y } : p));
  };

  // ─── 순서 이동 ───────────────────────────────────────────────────────────
  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
    setPhotos(newPhotos);
  };

  // Save the complete collection, including items hidden by the current filter.
  const saveChanges = async () => {
    if (controlsDisabled) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await runSave(
        ['아카이브 목록'],
        [updateGalleryPhotos(photos)],
        () => {
          setSavedPhotos(photos);
          showNotification();
        },
        () => {
          setSaveError('아카이브 목록 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.');
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── 파일 업로드 ─────────────────────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || controlsDisabled || hasPhotoEdits) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const result = await uploadGalleryFiles(files);
      const uploadedPhotos = result.data;
      if (result.success && uploadedPhotos && uploadedPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...uploadedPhotos]);
        setSavedPhotos((prev) => [...prev, ...uploadedPhotos]);
        showNotification();
      } else {
        setUploadError(result.error?.message ?? '업로드 실패. 다시 시도해 주세요.');
      }
    } catch {
      setUploadError('업로드 중 오류가 발생했습니다');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── 드래그 앤 드롭 ──────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  // ─── YouTube 추가 ────────────────────────────────────────────────────────
  const handleAddYoutube = async () => {
    if (controlsDisabled || hasPhotoEdits) return;
    if (!youtubePreviewId) {
      setYoutubeError('유효한 YouTube URL을 입력하세요');
      return;
    }
    setIsAddingYoutube(true);
    setYoutubeError('');
    try {
      const result = await addYouTubeGalleryVideo(youtubeUrl, youtubeLinkedEventId || undefined);
      const addedPhoto = result.data;
      if (result.success && addedPhoto) {
        setPhotos((prev) => [...prev, addedPhoto]);
        setYoutubeUrl('');
        setYoutubeLinkedEventId('');
        setSavedPhotos((prev) => [...prev, addedPhoto]);
        showNotification();
      } else {
        setYoutubeError(result.error?.message ?? 'YouTube 추가 실패. 다시 시도해 주세요.');
      }
    } catch {
      setYoutubeError('오류가 발생했습니다');
    } finally {
      setIsAddingYoutube(false);
    }
  };

  // ─── 삭제 ────────────────────────────────────────────────────────────────
  const handleDeletePhoto = async (index: number) => {
    const photo = photos[index];
    if (!photo || controlsDisabled || hasPhotoEdits) return;
    setIsDeleting(true);
    setSaveError('');
    try {
      const result = await deleteGalleryPhoto(photo.id);
      if (!result.success) {
        setSaveError('미디어를 삭제하지 못했습니다. 현재 목록은 유지됩니다. 다시 시도해 주세요.');
        return;
      }
      setPhotos((prev) => prev.filter((_, i) => i !== index));
      setSavedPhotos((prev) => prev.filter((_, i) => i !== index));
      setSelectedId(null);
    } catch {
      setSaveError('미디어를 삭제하지 못했습니다. 현재 목록은 유지됩니다. 다시 시도해 주세요.');
    } finally { setIsDeleting(false); }
  };

  const visiblePhotos = photos.map((photo, index) => ({ photo, index })).filter(({ photo }) => {
    const source = savedPhotos.find((saved) => saved.id === photo.id) ?? photo;
    const eventTitle = performances.find((event) => event.id === source.linkedEventId)?.title;
    const matches = [source.filename, source.caption, source.altText, eventTitle]
      .some((value) => value?.toLowerCase().includes(search.trim().toLowerCase()));
    return matches && (filter === 'all' || (filter === 'image' && photo.mediaType === 'image') ||
      (filter === 'video' && photo.mediaType !== 'image') || (filter === 'unlinked' && !photo.linkedEventId));
  });

  return <div className="space-y-8">
    <AdminSectionHeader title="아카이브" description="사진·영상과 연결된 공연을 관리합니다."
      onSave={saveChanges} isSaving={isSaving} isSaveDisabled={controlsDisabled || !hasPhotoEdits}
      action={<button type="button" className={styles.uploadAction} onClick={() => fileInputRef.current?.click()}
        disabled={controlsDisabled || hasPhotoEdits}>{isUploading ? '업로드 중…' : '파일 업로드'}</button>} />
    <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
    <SaveErrorMessage message={saveError} />
    {loadError && <div role="alert"><p>{loadError}</p><button type="button" className={styles.uploadAction} onClick={() => void fetchData()}>다시 불러오기</button></div>}
    <fieldset disabled={controlsDisabled} className="space-y-6">
      <input ref={fileInputRef} type="file" multiple aria-label="미디어 파일 선택"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
        className="sr-only" disabled={controlsDisabled || hasPhotoEdits} onChange={(event) => void handleUpload(event.target.files)} />
      <button type="button" className={styles.dropzone} disabled={controlsDisabled || hasPhotoEdits}
        onDrop={handleDrop} onDragOver={(event) => event.preventDefault()} onClick={() => fileInputRef.current?.click()}>
        <strong>사진·영상 파일을 여기에 놓거나 선택하세요</strong><span>이미지·동영상 · 파일당 최대 10MB · 업로드 즉시 반영</span>
      </button>
      {uploadError && <p role="alert">{uploadError}</p>}
      {hasPhotoEdits && <p className={collection.notice}>편집한 내용을 먼저 저장하면 파일 추가·삭제를 할 수 있습니다.</p>}
      <details className={collection.disclosure}>
        <summary>YouTube 영상 추가</summary>
        <div className={styles.youtube}>
          <FormInput label="YouTube URL" value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtu.be/..." />
          <EventSelect value={youtubeLinkedEventId} performances={performances} onChange={setYoutubeLinkedEventId} label="연결할 공연 (선택)" />
          <button type="button" className={styles.uploadAction} disabled={!youtubePreviewId || hasPhotoEdits} onClick={() => void handleAddYoutube()}>{isAddingYoutube ? '추가 중…' : '영상 추가'}</button>
          {youtubeError && <p role="alert">{youtubeError}</p>}
        </div>
      </details>
      <section aria-label="미디어 목록">
        <div className={collection.toolbar}>
          <FormInput label="미디어 검색" type="search" value={search} onChange={setSearch} placeholder="파일명, 설명, 공연명" />
          <div className={collection.filters} role="group" aria-label="미디어 필터">
            {[["all", "전체"], ["image", "사진"], ["video", "영상"], ["unlinked", "공연 미연결"]].map(([value, label]) =>
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
          </div>
        </div>
        <p role="status" className={collection.count}>{isLoading ? '미디어를 불러오는 중입니다.' : `${visiblePhotos.length}개 표시 / 전체 ${photos.length}개`}</p>
        <div className={collection.list}>
          {visiblePhotos.map(({ photo, index }) => <AdminCard key={photo.id}>
            {isDeleteModalOpen && deleteIndex === index ? <DeleteConfirmModal show itemName={photo.filename}
              onConfirm={() => confirmDelete(() => void handleDeletePhoto(index))} onCancel={closeConfirm} /> : <>
              <div className={styles.row}>
                <div className={styles.thumbnail}>
                  {photo.mediaType === 'image' ? <LoadingImage src={getPublicImageUrl(photo.id)} alt="" quiet /> :
                    photo.mediaType === 'video_youtube' ? <LoadingImage src={photo.videoThumbnailUrl || undefined} alt="" quiet /> : <span>영상</span>}
                </div>
                <button type="button" className={styles.summary} aria-expanded={selectedId === photo.id} aria-controls={`media-editor-${photo.id}`}
                  onClick={() => setSelectedId(selectedId === photo.id ? null : photo.id)}>
                  <strong>{photo.caption || photo.filename}</strong>
                  <span>{photo.mediaType === 'image' ? '사진' : '영상'} · {performances.find((event) => event.id === photo.linkedEventId)?.title ?? '공연 미연결'}</span>
                </button>
                <button type="button" className={styles.uploadAction} aria-label={`${selectedId === photo.id ? '편집 닫기' : '편집'} ${photo.filename}`} aria-expanded={selectedId === photo.id} aria-controls={`media-editor-${photo.id}`}
                  onClick={() => setSelectedId(selectedId === photo.id ? null : photo.id)}>{selectedId === photo.id ? '편집 닫기' : '편집'}<span className="sr-only"> {photo.filename}</span></button>
              </div>
              {selectedId === photo.id && <div id={`media-editor-${photo.id}`} className={styles.editor}>
                <div className={styles.fields}>
                  <FormInput label="이미지 설명" value={photo.altText} onChange={(value) => updatePhotoField(index, 'altText', value)} placeholder="이미지를 보지 못하는 사용자를 위한 설명" />
                  <FormInput label="캡션" value={photo.caption} onChange={(value) => updatePhotoField(index, 'caption', value)} />
                  <EventSelect value={photo.linkedEventId ?? ''} performances={performances} onChange={(value) => updatePhotoField(index, 'linkedEventId', value)} />
                </div>
                <div className={styles.editorFooter}>
                  {photo.mediaType === 'image' && <div className={styles.focal}><FocalPicker photoId={photo.id} focalX={photo.focalX} focalY={photo.focalY} onFocalChange={(x,y) => updateFocal(index,x,y)} /><p>이미지의 초점을 선택하세요.<br />방향키로도 조절할 수 있습니다.</p></div>}
                  {photo.mediaType === 'video_file' && <video src={`/api/media/${photo.id}`} controls preload="none" className={styles.video} aria-label={`${photo.filename} 미리보기`} />}
                  {photo.mediaType === 'video_youtube' && <a href={`https://www.youtube.com/watch?v=${photo.videoYoutubeId}`} target="_blank" rel="noreferrer">YouTube에서 보기</a>}
                  <div className={styles.itemActions}>
                    <button type="button" disabled={index === 0 || Boolean(search) || filter !== 'all'} onClick={() => movePhoto(index,'up')}>위로</button>
                    <button type="button" disabled={index === photos.length - 1 || Boolean(search) || filter !== 'all'} onClick={() => movePhoto(index,'down')}>아래로</button>
                    <button type="button" disabled={hasPhotoEdits} onClick={() => openConfirm(index)} aria-label={`미디어 ${photo.filename} 삭제`}>삭제</button>
                  </div>
                </div>
                {(search || filter !== 'all') && <p className={collection.notice}>순서는 검색과 필터를 초기화한 전체 목록에서 변경할 수 있습니다.</p>}
              </div>}
            </>}
          </AdminCard>)}
        </div>
        {!isLoading && !loadError && visiblePhotos.length === 0 && <div className={collection.empty}>
          <p>{photos.length ? '조건에 맞는 미디어가 없습니다.' : '아직 등록된 미디어가 없습니다.'}</p>
          {photos.length > 0 && <button type="button" onClick={() => { setSearch(''); setFilter('all'); }}>필터 초기화</button>}
        </div>}
      </section>
    </fieldset>
  </div>;
};

export default AdminGalleryPage;
