'use client';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import SuccessMessage from '@/components/base/SuccessMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useListEditor } from '@/hooks/useListEditor';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RAApiConfig, Performance, PageMeta } from '@/types/content';
import {
  fetchRAEvents,
  convertRAEventsToPerformances,
  sortEventsByDate,
} from '@/utils/raApi';
import { createBorderFaint } from '@/utils/colorMix';
import {
  updatePerformances as apiUpdatePerformances,
  updatePageMeta as apiUpdatePageMeta,
  updateRaApiConfig as apiUpdateRaApiConfig,
  uploadEventPoster,
  deleteEventPoster,
} from '@/services/adminService';

const AdminEventsPage = () => {
  const { t } = useTranslation();
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];

  const {
    items: performances,
    setItems: setPerformances,
    updateItem: updatePerformance,
    deleteItem: deletePerformance,
  } = useListEditor<Performance>(content.performances);

  const [raApiConfig, setRaApiConfig] = useState<RAApiConfig>(
    content.raApiConfig || { userId: '', apiKey: '', djId: '', option: '1', year: '' }
  );
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [posterUploading, setPosterUploading] = useState<Record<string, boolean>>({});

  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  const {
    isOpen: isDeleteModalOpen,
    pendingIndex: deleteIndex,
    openConfirm: openDeleteConfirm,
    closeConfirm: closeDeleteConfirm,
    confirmDelete,
  } = useDeleteConfirm();

  useEffect(() => {
    // 구버전 status 값 정규화 (DB 마이그레이션 전 환경 대비)
    const normalized = allContent[currentEditLanguage].performances.map((p) => ({
      ...p,
      status: (p.status === ('Confirmed' as string) ? 'Announced'
             : p.status === ('Pending'   as string) ? 'TBA'
             : p.status) as Performance['status'],
    }));
    // 초기 로드 시에도 최신순 정렬 보장
    setPerformances(sortEventsByDate(normalized, false));
    setRaApiConfig(
      allContent[currentEditLanguage].raApiConfig || { userId: '', apiKey: '', djId: '', option: '1', year: '' }
    );
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent, setPerformances]);

  const updatePageMetaField = (field: keyof PageMeta['events'], value: string) => {
    setPageMeta(prev => ({ ...prev, events: { ...prev.events, [field]: value } }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    await Promise.allSettled([
      apiUpdatePerformances(performances),
      apiUpdatePageMeta(currentEditLanguage, pageMeta),
      apiUpdateRaApiConfig(raApiConfig),
    ]);
    updateContent({ performances, raApiConfig, pageMeta });
    showNotification();
    setIsSaving(false);
  };

  const fetchFromRA = async () => {
    if (!raApiConfig.userId || !raApiConfig.apiKey || !raApiConfig.djId) {
      setFetchError(t('events_api_config_required'));
      return;
    }
    setIsFetching(true);
    setFetchError('');
    setFetchSuccess('');
    try {
      const response = await fetchRAEvents({ option: raApiConfig.option, year: raApiConfig.year });
      const raPerformances = convertRAEventsToPerformances(response.events);

      // 이미 저장된 RA 이벤트 ID 집합 (raEventId 기준 중복 제외)
      const existingRaIds = new Set(
        performances.filter((p) => p.raEventId).map((p) => p.raEventId)
      );
      const newPerformances = raPerformances.filter(
        (p) => p.raEventId && !existingRaIds.has(p.raEventId)
      );
      const skipped = raPerformances.length - newPerformances.length;

      // 기존 이벤트 + 새 RA 이벤트 병합 후 날짜순 정렬 (최신순: ascending = false)
      const merged = sortEventsByDate([...performances, ...newPerformances], false);
      setPerformances(merged);

      setFetchSuccess(
        `${newPerformances.length}개 추가됨${skipped > 0 ? ` (${skipped}개 중복 제외)` : ''}`
      );
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : t('events_sync_error'));
    } finally {
      setIsFetching(false);
    }
  };

  const addNewPerformance = () => {
    const newPerf: Performance = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      venue: 'New Venue',
      title: 'New Performance',
      location: 'Seoul',
      time: '23:00',
      status: 'TBA',
    };
    setPerformances([newPerf, ...performances]);
  };

  const updatePerformanceField = (index: number, field: keyof Performance, value: string) => {
    const current = performances[index];
    if (current) {
      updatePerformance(index, { ...current, [field]: value });
    }
  };

  const updateRaApiConfigField = (field: keyof RAApiConfig, value: string) => {
    setRaApiConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handlePosterUpload = async (eventId: string, file: File) => {
    setPosterUploading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const result = await uploadEventPoster(eventId, file);
      if (result.success && result.data) {
        setPerformances(
          performances.map((p) => p.id === eventId ? { ...p, posterImageId: result.data!.photoId } : p)
        );
      }
    } finally {
      setPosterUploading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handlePosterDelete = async (eventId: string) => {
    setPosterUploading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const result = await deleteEventPoster(eventId);
      if (result.success) {
        setPerformances(
          performances.map((p) => p.id === eventId ? { ...p, posterImageId: undefined } : p)
        );
      }
    } finally {
      setPosterUploading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="EVENTS SECTION"
        description={`${t('admin_events_subtitle')} (${currentEditLanguage.toUpperCase()})`}
        onSave={saveChanges}
        isSaving={isSaving}
        action={
          <button
            onClick={addNewPerformance}
            className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider"
            style={createBorderFaint()}
          >
            <i className="ri-add-line mr-2"></i>ADD EVENT
          </button>
        }
      />

      <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />

      {/* PAGE SETTINGS */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
          PAGE SETTINGS
        </h2>
        <AdminCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="PAGE TITLE"
              value={pageMeta.events.title}
              onChange={(value) => updatePageMetaField('title', value)}
              placeholder="EVENTS"
            />
            <FormInput
              label="PAGE SUBTITLE"
              value={pageMeta.events.subtitle}
              onChange={(value) => updatePageMetaField('subtitle', value)}
              placeholder="PERFORMANCE SCHEDULE & INFORMATION"
            />
            <FormInput
              label="UPCOMING SECTION TITLE"
              value={pageMeta.events.upcomingTitle}
              onChange={(value) => updatePageMetaField('upcomingTitle', value)}
              placeholder="UPCOMING EVENTS"
            />
            <FormInput
              label="PAST SECTION TITLE"
              value={pageMeta.events.pastTitle}
              onChange={(value) => updatePageMetaField('pastTitle', value)}
              placeholder="PAST EVENTS"
            />
          </div>
        </AdminCard>
      </div>

      {/* RA API Settings */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
          {t('events_ra_settings')}
        </h2>
        <AdminCard>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t('events_api_userid')}
                value={raApiConfig.userId}
                onChange={(value) => updateRaApiConfigField('userId', value)}
                placeholder="123456"
              />
              <FormInput
                label={t('events_api_key')}
                value={raApiConfig.apiKey}
                onChange={(value) => updateRaApiConfigField('apiKey', value)}
                placeholder="your-api-key"
              />
              <FormInput
                label={t('events_api_djid')}
                value={raApiConfig.djId}
                onChange={(value) => updateRaApiConfigField('djId', value)}
                placeholder="123456"
              />
              <div>
                <label className="block text-xs text-[var(--color-accent)] tracking-widest mb-2">
                  {t('events_api_option')}
                </label>
                <select
                  value={raApiConfig.option}
                  onChange={(e) => updateRaApiConfigField('option', e.target.value as RAApiConfig['option'])}
                  className="w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                >
                  <option value="1">{t('events_api_option_1')}</option>
                  <option value="2">{t('events_api_option_2')}</option>
                  <option value="3">{t('events_api_option_3')}</option>
                  <option value="4">{t('events_api_option_4')}</option>
                </select>
              </div>
              <FormInput
                label="YEAR (선택사항, 미입력시 올해 기준)"
                value={raApiConfig.year ?? ''}
                onChange={(value) => updateRaApiConfigField('year', value)}
                placeholder="2025"
              />
            </div>
            <div className="space-y-2">
              <button
                onClick={fetchFromRA}
                disabled={isFetching}
                className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] tracking-wider text-sm hover:bg-[var(--color-primary)] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? t('events_fetching') : t('events_fetch_from_ra')}
              </button>
              {fetchError && <p className="text-sm text-red-400 tracking-wider">{fetchError}</p>}
              {fetchSuccess && <p className="text-sm text-green-400 tracking-wider">{fetchSuccess}</p>}
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Events */}
      <div>
        <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
          EVENTS
        </h2>
        <div className="space-y-4">
          {performances.map((performance, index) => (
            <AdminCard key={performance.id}>
              {isDeleteModalOpen && deleteIndex === index ? (
                <DeleteConfirmModal
                  show={true}
                  itemName={deleteIndex !== null ? performances[deleteIndex]?.venue || '' : ''}
                  onConfirm={() => confirmDelete(deletePerformance)}
                  onCancel={closeDeleteConfirm}
                />
              ) : (
                <div className="flex items-start gap-4">
                  {/* 포스터 썸네일 — 있을 때만 좌측 표시 */}
                  {performance.posterImageId && (
                    <div className="shrink-0 w-20 h-20 overflow-hidden">
                      <img
                        src={`/api/media/${performance.posterImageId}`}
                        alt="Poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="TITLE"
                      value={performance.title}
                      onChange={(value) => updatePerformanceField(index, 'title', value)}
                      placeholder="Performance Title"
                    />
                    <FormInput
                      label="DATE"
                      type="date"
                      value={performance.date}
                      onChange={(value) => updatePerformanceField(index, 'date', value)}
                    />
                    <FormInput
                      label="TIME"
                      type="time"
                      value={performance.time ?? ''}
                      onChange={(value) => updatePerformanceField(index, 'time', value)}
                    />
                    <FormInput
                      label="VENUE"
                      value={performance.venue}
                      onChange={(value) => updatePerformanceField(index, 'venue', value)}
                    />
                    <FormInput
                      label="LOCATION"
                      value={performance.location ?? ''}
                      onChange={(value) => updatePerformanceField(index, 'location', value)}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--color-accent)] tracking-widest mb-2">STATUS</label>
                      <select
                        value={performance.status}
                        onChange={(e) => updatePerformanceField(index, 'status', e.target.value)}
                        className="w-full bg-[var(--color-bg)] border-b border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-sm tracking-wider py-2 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                      >
                        <option value="Announced">Announced</option>
                        <option value="TBA">TBA</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    {performance.raEventId && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-[var(--color-accent)] tracking-widest">
                          RA에서 가져온 이벤트 (ID: {performance.raEventId})
                        </p>
                      </div>
                    )}
                    {/* 포스터 이미지 업로드 (선택 사항) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs text-[var(--color-accent)] tracking-widest">
                        POSTER IMAGE <span className="text-[var(--color-secondary)]/30 normal-case font-normal">(선택)</span>
                      </label>
                      {performance.posterImageId ? (
                        <button
                          onClick={() => handlePosterDelete(performance.id)}
                          disabled={posterUploading[performance.id]}
                          className="text-xs text-red-400 hover:text-red-300 tracking-widest disabled:opacity-50 cursor-pointer"
                        >
                          {posterUploading[performance.id] ? 'REMOVING...' : 'REMOVE POSTER'}
                        </button>
                      ) : (
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] tracking-widest transition-colors">
                          <i className="ri-upload-line"></i>
                          {posterUploading[performance.id] ? 'UPLOADING...' : 'UPLOAD POSTER'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={posterUploading[performance.id]}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePosterUpload(performance.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openDeleteConfirm(index)}
                    className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer shrink-0"
                    title="Delete"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminEventsPage;
