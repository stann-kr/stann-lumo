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
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RAApiConfig, Performance, PageMeta } from '@/types/content';
import type { EventsDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';
import {
  fetchRAEvents,
  convertRAEventsToPerformances,
  removeDuplicateEvents,
  sortEventsByDate,
} from '@/utils/raApi';
import { createBorderFaint } from '@/utils/colorMix';
import {
  updatePerformances as apiUpdatePerformances,
  updatePageMeta as apiUpdatePageMeta,
  updateRaApiConfig as apiUpdateRaApiConfig,
  fetchDisplaySettings,
  updateDisplaySettings,
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
    addItem: addPerformance,
  } = useListEditor<Performance>(content.performances);

  const [raApiConfig, setRaApiConfig] = useState<RAApiConfig>(
    content.raApiConfig || { userId: '', apiKey: '', djId: '', option: '1' }
  );
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [displaySettings, setDisplaySettings] = useState<EventsDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.events
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  const {
    isOpen: isDeleteModalOpen,
    pendingIndex: deleteIndex,
    openConfirm: openDeleteConfirm,
    closeConfirm: closeDeleteConfirm,
    confirmDelete,
  } = useDeleteConfirm();

  useEffect(() => {
    setPerformances(allContent[currentEditLanguage].performances);
    setRaApiConfig(
      allContent[currentEditLanguage].raApiConfig || { userId: '', apiKey: '', djId: '', option: '1' }
    );
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent, setPerformances]);

  useEffect(() => {
    fetchDisplaySettings('events').then((res) => {
      if (res.success && res.data) {
        setDisplaySettings(res.data as EventsDisplaySettings);
      }
    });
  }, []);

  const updatePageMetaField = (field: keyof PageMeta['events'], value: string) => {
    setPageMeta(prev => ({ ...prev, events: { ...prev.events, [field]: value } }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    await Promise.allSettled([
      apiUpdatePerformances(performances),
      apiUpdatePageMeta(currentEditLanguage, pageMeta),
      apiUpdateRaApiConfig(raApiConfig),
      updateDisplaySettings('events', displaySettings),
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
      const response = await fetchRAEvents(raApiConfig);
      const raPerformances = convertRAEventsToPerformances(response.events);
      const manualPerformances = performances.filter((p) => !p.raEventId);
      const merged = removeDuplicateEvents([...manualPerformances, ...raPerformances]);
      const sorted = sortEventsByDate(merged, true);
      setPerformances(sorted);
      setFetchSuccess(`${t('events_sync_success')} (${raPerformances.length})`);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : t('events_sync_error'));
    } finally {
      setIsFetching(false);
    }
  };

  const addNewPerformance = () => {
    addPerformance({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      venue: 'New Venue',
      title: 'New Performance',
      location: 'Seoul',
      time: '23:00',
      status: 'Pending',
    });
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
              label="CARD GAP"
              value={displaySettings.cardGap}
              options={[
                { value: 'sm', label: 'SM' },
                { value: 'md', label: 'MD' },
                { value: 'lg', label: 'LG' },
              ]}
              onChange={(v) => setDisplaySettings((prev) => ({ ...prev, cardGap: v }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="INITIAL PAST COUNT"
                type="number"
                value={String(displaySettings.initialPastCount)}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, initialPastCount: Math.max(1, parseInt(v) || 1) }))}
              />
              <FormInput
                label="LOAD MORE COUNT"
                type="number"
                value={String(displaySettings.loadMoreCount)}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, loadMoreCount: Math.max(1, parseInt(v) || 1) }))}
              />
              <FormInput
                label="PAST EVENT OPACITY (%)"
                type="number"
                value={String(displaySettings.pastEventOpacity)}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, pastEventOpacity: Math.min(100, Math.max(0, parseInt(v) || 0)) }))}
              />
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
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
