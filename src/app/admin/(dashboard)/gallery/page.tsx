'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import SuccessMessage from '@/components/base/SuccessMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { createBorderFaint } from '@/utils/colorMix';
import type { GalleryPhoto, GallerySettings } from '@/types/content';

// ─── YouTube URL 파싱 (클라이언트 전용) ───────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

const DEFAULT_SETTINGS: GallerySettings = {
  layoutMode: 'masonry',
  columnsMobile: 2,
  columnsTablet: 3,
  columnsDesktop: 4,
  gapSize: 'md',
  aspectRatio: 'auto',
  hoverEffect: 'zoom',
  captionDisplay: 'overlay',
  lightboxEnabled: true,
};

// ─── RadioGroup 헬퍼 ─────────────────────────────────────────────────────────
interface RadioGroupProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}
function RadioGroup<T extends string>({ label, value, options, onChange }: RadioGroupProps<T>) {
  const borderStyle = createBorderFaint();
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-[var(--color-accent)] tracking-widest">{label}</p>
      <div className="flex gap-3 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs tracking-wider border transition-colors cursor-pointer ${
              value === opt.value
                ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/60 text-[var(--color-accent)]'
                : 'text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
            }`}
            style={value !== opt.value ? borderStyle : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FocalPicker ─────────────────────────────────────────────────────────────
interface FocalPickerProps {
  photoId: string;
  focalX: number;
  focalY: number;
  onFocalChange: (x: number, y: number) => void;
}
function FocalPicker({ photoId, focalX, focalY, onFocalChange }: FocalPickerProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
    <div
      className="relative w-24 h-24 shrink-0 overflow-hidden border cursor-crosshair"
      style={createBorderFaint()}
      onClick={handleClick}
      title="클릭하여 포컬 포인트 설정"
    >
      <img
        src={`/api/media/${photoId}`}
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
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
const AdminGalleryPage = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [settings, setSettings] = useState<GallerySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // YouTube 입력
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubePreviewId, setYoutubePreviewId] = useState<string | null>(null);
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();
  const { isOpen: isDeleteModalOpen, pendingIndex: deleteIndex, openConfirm, closeConfirm, confirmDelete } = useDeleteConfirm();
  const borderStyle = createBorderFaint();

  // ─── 초기 데이터 로드 ────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [photosRes, settingsRes] = await Promise.all([
        fetch('/api/admin/gallery'),
        fetch('/api/admin/gallery-settings'),
      ]);
      const photosJson = (await photosRes.json()) as { success: boolean; data: GalleryPhoto[] };
      const settingsJson = (await settingsRes.json()) as { success: boolean; data: GallerySettings };
      if (photosJson.success) setPhotos(photosJson.data);
      if (settingsJson.success) setSettings(settingsJson.data);
    } catch {
      // 조용히 실패
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── YouTube URL 실시간 파싱 ─────────────────────────────────────────────
  useEffect(() => {
    setYoutubePreviewId(extractYoutubeId(youtubeUrl));
    setYoutubeError('');
  }, [youtubeUrl]);

  // ─── 설정 업데이트 ───────────────────────────────────────────────────────
  const updateSetting = <K extends keyof GallerySettings>(key: K, value: GallerySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ─── 사진 메타 필드 업데이트 ─────────────────────────────────────────────
  const updatePhotoField = (index: number, field: keyof Pick<GalleryPhoto, 'altText' | 'caption'>, value: string) => {
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
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

  // ─── 저장 (photos + settings 병렬) ──────────────────────────────────────
  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        fetch('/api/admin/gallery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos }),
        }),
        fetch('/api/admin/gallery-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }),
      ]);
      showNotification();
    } catch {
      // 조용히 실패
    } finally {
      setIsSaving(false);
    }
  };

  // ─── 파일 업로드 ─────────────────────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError('');
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    try {
      const res = await fetch('/api/admin/gallery/upload', { method: 'POST', body: formData });
      const json = (await res.json()) as { success: boolean; data: GalleryPhoto[]; error?: { message: string } };
      if (json.success && json.data.length > 0) {
        setPhotos((prev) => [...prev, ...json.data]);
        showNotification();
      } else if (!json.success) {
        setUploadError(json.error?.message ?? '업로드 실패');
      }
    } catch {
      setUploadError('업로드 중 오류가 발생했습니다');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── 드래그 앤 드롭 ──────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  // ─── YouTube 추가 ────────────────────────────────────────────────────────
  const handleAddYoutube = async () => {
    if (!youtubePreviewId) {
      setYoutubeError('유효한 YouTube URL을 입력하세요');
      return;
    }
    setIsAddingYoutube(true);
    setYoutubeError('');
    try {
      const res = await fetch('/api/admin/gallery/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl }),
      });
      const json = (await res.json()) as { success: boolean; data: GalleryPhoto; error?: { message: string } };
      if (json.success) {
        setPhotos((prev) => [...prev, json.data]);
        setYoutubeUrl('');
        showNotification();
      } else {
        setYoutubeError(json.error?.message ?? 'YouTube 추가 실패');
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
    if (!photo) return;
    try {
      await fetch(`/api/admin/gallery/${photo.id}`, { method: 'DELETE' });
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    } catch {
      // 조용히 실패
    }
  };

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="GALLERY"
        description="사진 업로드 및 레이아웃 관리"
        onSave={saveChanges}
        isSaving={isSaving}
        action={
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            style={borderStyle}
          >
            <i className="ri-upload-line mr-2"></i>
            {isUploading ? 'UPLOADING...' : 'UPLOAD'}
          </button>
        }
      />

      <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />

      {/* 파일 입력 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* ── DISPLAY SETTINGS 카드 ─────────────────────────────────────── */}
      <AdminCard>
        <div className="space-y-6">
          <p className="text-xs text-[var(--color-accent)] tracking-widest border-b pb-3" style={borderStyle}>
            DISPLAY SETTINGS
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 레이아웃 모드 */}
            <RadioGroup
              label="LAYOUT MODE"
              value={settings.layoutMode}
              options={[
                { value: 'masonry', label: 'Masonry' },
                { value: 'grid', label: 'Grid' },
              ]}
              onChange={(v) => updateSetting('layoutMode', v)}
            />

            {/* 간격 */}
            <RadioGroup
              label="GAP SIZE"
              value={settings.gapSize}
              options={[
                { value: 'sm', label: 'Tight' },
                { value: 'md', label: 'Normal' },
                { value: 'lg', label: 'Wide' },
              ]}
              onChange={(v) => updateSetting('gapSize', v)}
            />

            {/* 열 수 */}
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs text-[var(--color-accent)] tracking-widest">COLUMNS</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[var(--color-secondary)]/40 tracking-wider mb-1.5">Mobile</p>
                  <select
                    value={settings.columnsMobile}
                    onChange={(e) => updateSetting('columnsMobile', Number(e.target.value) as GallerySettings['columnsMobile'])}
                    className="w-full bg-transparent border px-2 py-1.5 text-sm text-[var(--color-secondary)] cursor-pointer focus:outline-none"
                    style={borderStyle}
                  >
                    <option value={1}>1열</option>
                    <option value={2}>2열</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-secondary)]/40 tracking-wider mb-1.5">Tablet</p>
                  <select
                    value={settings.columnsTablet}
                    onChange={(e) => updateSetting('columnsTablet', Number(e.target.value) as GallerySettings['columnsTablet'])}
                    className="w-full bg-transparent border px-2 py-1.5 text-sm text-[var(--color-secondary)] cursor-pointer focus:outline-none"
                    style={borderStyle}
                  >
                    <option value={2}>2열</option>
                    <option value={3}>3열</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-secondary)]/40 tracking-wider mb-1.5">Desktop</p>
                  <select
                    value={settings.columnsDesktop}
                    onChange={(e) => updateSetting('columnsDesktop', Number(e.target.value) as GallerySettings['columnsDesktop'])}
                    className="w-full bg-transparent border px-2 py-1.5 text-sm text-[var(--color-secondary)] cursor-pointer focus:outline-none"
                    style={borderStyle}
                  >
                    <option value={2}>2열</option>
                    <option value={3}>3열</option>
                    <option value={4}>4열</option>
                    <option value={5}>5열</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 비율 (grid 모드에서만 활성) */}
            <div className={settings.layoutMode !== 'grid' ? 'opacity-40 pointer-events-none' : ''}>
              <p className="text-xs text-[var(--color-accent)] tracking-widest mb-1.5">
                ASPECT RATIO
                {settings.layoutMode !== 'grid' && (
                  <span className="ml-2 text-[var(--color-secondary)]/30 normal-case">(grid 모드에서만)</span>
                )}
              </p>
              <select
                value={settings.aspectRatio}
                onChange={(e) => updateSetting('aspectRatio', e.target.value as GallerySettings['aspectRatio'])}
                disabled={settings.layoutMode !== 'grid'}
                className="w-full bg-transparent border px-2 py-1.5 text-sm text-[var(--color-secondary)] cursor-pointer focus:outline-none disabled:cursor-not-allowed"
                style={borderStyle}
              >
                <option value="auto">Auto (natural)</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
                <option value="16:9">16:9</option>
              </select>
            </div>

            {/* 호버 효과 */}
            <RadioGroup
              label="HOVER EFFECT"
              value={settings.hoverEffect}
              options={[
                { value: 'zoom', label: 'Zoom' },
                { value: 'fade', label: 'Fade' },
                { value: 'none', label: 'None' },
              ]}
              onChange={(v) => updateSetting('hoverEffect', v)}
            />

            {/* 캡션 */}
            <RadioGroup
              label="CAPTION"
              value={settings.captionDisplay}
              options={[
                { value: 'overlay', label: 'Overlay' },
                { value: 'below', label: 'Below' },
                { value: 'hidden', label: 'Hidden' },
              ]}
              onChange={(v) => updateSetting('captionDisplay', v)}
            />

            {/* 라이트박스 */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[var(--color-accent)] tracking-widest">LIGHTBOX</p>
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <div
                  onClick={() => updateSetting('lightboxEnabled', !settings.lightboxEnabled)}
                  className={`w-10 h-5 relative border transition-colors cursor-pointer ${
                    settings.lightboxEnabled
                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/60'
                      : ''
                  }`}
                  style={!settings.lightboxEnabled ? borderStyle : undefined}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 transition-all ${
                      settings.lightboxEnabled
                        ? 'left-5 bg-[var(--color-accent)]'
                        : 'left-0.5 bg-[var(--color-secondary)]/30'
                    }`}
                  />
                </div>
                <span className="text-sm text-[var(--color-secondary)]/60 tracking-wider">
                  {settings.lightboxEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* ── 파일 업로드 영역 ──────────────────────────────────────────────── */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--color-secondary)]/20 hover:border-[var(--color-secondary)]/40 transition-colors p-12 flex flex-col items-center justify-center gap-3 cursor-pointer"
      >
        <i className="ri-image-add-line text-3xl text-[var(--color-secondary)]/30"></i>
        <p className="text-[var(--color-secondary)]/40 text-sm tracking-wider text-center">
          드래그 앤 드롭 또는 클릭하여 업로드
        </p>
        <p className="text-[var(--color-secondary)]/20 text-xs tracking-wider">
          JPG · PNG · WebP · GIF · AVIF · MP4 · WebM · 최대 10MB
        </p>
        {isUploading && (
          <p className="text-[var(--color-accent)] text-sm tracking-widest animate-pulse">
            UPLOADING...
          </p>
        )}
        {uploadError && (
          <p className="text-red-400 text-sm tracking-wider">{uploadError}</p>
        )}
      </div>

      {/* ── YouTube 추가 ──────────────────────────────────────────────────── */}
      <AdminCard>
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-accent)] tracking-widest border-b pb-3" style={borderStyle}>
            YOUTUBE 동영상 추가
          </p>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <FormInput
                label="YouTube URL"
                value={youtubeUrl}
                onChange={setYoutubeUrl}
                placeholder="https://youtu.be/... 또는 https://youtube.com/watch?v=..."
              />
              {youtubeError && (
                <p className="text-red-400 text-xs tracking-wider mt-1">{youtubeError}</p>
              )}
            </div>
            {/* 썸네일 미리보기 */}
            {youtubePreviewId && (
              <div className="shrink-0 w-24 h-16 overflow-hidden border" style={borderStyle}>
                <img
                  src={`https://img.youtube.com/vi/${youtubePreviewId}/mqdefault.jpg`}
                  alt="YouTube preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button
              onClick={handleAddYoutube}
              disabled={!youtubePreviewId || isAddingYoutube}
              className="px-4 py-2 border text-sm text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap tracking-wider self-end"
              style={borderStyle}
            >
              <i className="ri-youtube-line mr-1.5"></i>
              {isAddingYoutube ? '추가 중...' : '갤러리에 추가'}
            </button>
          </div>
        </div>
      </AdminCard>

      {/* ── 사진 목록 ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-[var(--color-secondary)]/40 text-sm tracking-widest animate-pulse">LOADING...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="flex items-center justify-center py-16 border" style={borderStyle}>
          <p className="text-[var(--color-secondary)]/30 text-sm tracking-widest">
            업로드된 미디어가 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {photos.map((photo, index) => (
            <AdminCard key={photo.id}>
              {isDeleteModalOpen && deleteIndex === index ? (
                <DeleteConfirmModal
                  show={true}
                  itemName={photo.filename}
                  onConfirm={() => confirmDelete(() => handleDeletePhoto(index))}
                  onCancel={closeConfirm}
                />
              ) : (
                <div className="flex items-start gap-4">
                  {/* 썸네일 / 포컬 피커 */}
                  {photo.mediaType === 'image' ? (
                    <FocalPicker
                      photoId={photo.id}
                      focalX={photo.focalX}
                      focalY={photo.focalY}
                      onFocalChange={(x, y) => updateFocal(index, x, y)}
                    />
                  ) : photo.mediaType === 'video_youtube' ? (
                    <div className="w-24 h-24 shrink-0 overflow-hidden border relative" style={borderStyle}>
                      <img
                        src={photo.videoThumbnailUrl ?? ''}
                        alt={photo.altText}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <i className="ri-youtube-fill text-red-500 text-2xl"></i>
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 shrink-0 overflow-hidden border relative" style={borderStyle}>
                      <video
                        src={`/api/media/${photo.id}`}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <i className="ri-movie-line text-[var(--color-secondary)] text-xl"></i>
                      </div>
                    </div>
                  )}

                  {/* 편집 필드 */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-accent)] tracking-widest mb-1">FILENAME</p>
                      <p className="text-sm text-[var(--color-secondary)]/60 truncate">{photo.filename}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[var(--color-secondary)]/30">
                          {photo.mediaType === 'video_youtube'
                            ? 'YouTube'
                            : `${(photo.sizeBytes / 1024).toFixed(0)} KB`}
                        </p>
                        {photo.mediaType !== 'image' && (
                          <span className="text-xs px-1.5 py-0.5 border border-[var(--color-accent)]/30 text-[var(--color-accent)]/60 tracking-wider">
                            {photo.mediaType === 'video_youtube' ? '▶ YT' : '🎬 VIDEO'}
                          </span>
                        )}
                      </div>
                      {photo.mediaType === 'image' && (
                        <p className="text-xs text-[var(--color-secondary)]/25 mt-1">
                          focal: {photo.focalX}% {photo.focalY}%
                        </p>
                      )}
                    </div>
                    <FormInput
                      label="ALT TEXT"
                      value={photo.altText}
                      onChange={(value) => updatePhotoField(index, 'altText', value)}
                      placeholder="이미지 설명 (접근성)"
                    />
                    <div className="md:col-span-2">
                      <FormInput
                        label="CAPTION"
                        value={photo.caption}
                        onChange={(value) => updatePhotoField(index, 'caption', value)}
                        placeholder="갤러리에 표시될 캡션"
                      />
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => movePhoto(index, 'up')}
                      disabled={index === 0}
                      className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      style={borderStyle}
                      title="위로"
                    >
                      <i className="ri-arrow-up-s-line"></i>
                    </button>
                    <button
                      onClick={() => movePhoto(index, 'down')}
                      disabled={index === photos.length - 1}
                      className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      style={borderStyle}
                      title="아래로"
                    >
                      <i className="ri-arrow-down-s-line"></i>
                    </button>
                    <button
                      onClick={() => openConfirm(index)}
                      className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGalleryPage;
