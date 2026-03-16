import AdminLayout from '../../../components/feature/AdminLayout';
import { useContent } from '../../../contexts/ContentContext';
import AdminCard from '../../../components/base/AdminCard';
import AdminSectionHeader from '../../../components/base/AdminSectionHeader';
import FormInput from '../../../components/base/FormInput';
import SuccessMessage from '../../../components/base/SuccessMessage';
import DeleteConfirmModal from '../../../components/base/DeleteConfirmModal';
import ListItemEditor from '../../../components/base/ListItemEditor';
import { useListEditor } from '../../../hooks/useListEditor';
import { useDeleteConfirm } from '../../../hooks/useDeleteConfirm';
import { useSaveNotification } from '../../../hooks/useSaveNotification';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RAApiConfig } from '../../../types/content';
import {
  fetchRAEvents,
  convertRAEventsToPerformances,
  removeDuplicateEvents,
  sortEventsByDate,
} from '../../../utils/raApi';
import { createBorderFaint } from '../../../utils/colorMix';

interface Performance {
  id: string;
  date: string;
  venue: string;
  location: string;
  time: string;
  status: string;
  lineup?: string;
  raEventLink?: string;
  raEventId?: string;
}

interface EventsInfo {
  setDurations: string[];
  technicalRequirements: string[];
  contactEmail: string;
  responseTime: string;
}

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

  const [eventsInfo, setEventsInfo] = useState<EventsInfo>(content.eventsInfo);
  const [raApiConfig, setRaApiConfig] = useState<RAApiConfig>(
    content.raApiConfig || { userId: '', apiKey: '', djId: '', option: '1' }
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
    setEventsInfo(allContent[currentEditLanguage].eventsInfo);
    setPerformances(allContent[currentEditLanguage].performances);
    setRaApiConfig(
      allContent[currentEditLanguage].raApiConfig || { userId: '', apiKey: '', djId: '', option: '1' }
    );
  }, [currentEditLanguage, allContent, setPerformances]);

  const saveChanges = async () => {
    setIsSaving(true);
    updateContent({ performances, eventsInfo, raApiConfig });
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
      const response = await fetchRAEvents({
        userid: raApiConfig.userId,
        apiKey: raApiConfig.apiKey,
        djid: raApiConfig.djId,
        option: raApiConfig.option,
      });
      const raPerformances = convertRAEventsToPerformances(response.events);
      const manualPerformances = performances.filter((p) => !p.raEventId);
      const merged = removeDuplicateEvents([...manualPerformances, ...raPerformances]);
      const sorted = sortEventsByDate(merged, true);
      setPerformances(sorted);
      setFetchSuccess(`${raPerformances.length}개의 이벤트를 가져왔습니다.`);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'RA API 호출 중 오류가 발생했습니다.');
    } finally {
      setIsFetching(false);
    }
  };

  const addNewPerformance = () => {
    addPerformance({
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      venue: 'New Venue',
      location: 'Seoul',
      time: '23:00',
      status: 'Pending',
    });
  };

  const updatePerformanceField = (index: number, field: keyof Performance, value: string) => {
    updatePerformance(index, { ...performances[index], [field]: value });
  };

  const updateEventsInfoField = (field: keyof EventsInfo, value: string | string[]) => {
    setEventsInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updateRaApiConfigField = (field: keyof RAApiConfig, value: string) => {
    setRaApiConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateListItem = (field: 'setDurations' | 'technicalRequirements', index: number, value: string) => {
    const updated = [...eventsInfo[field]];
    updated[index] = value;
    updateEventsInfoField(field, updated);
  };

  const addListItem = (field: 'setDurations' | 'technicalRequirements') => {
    updateEventsInfoField(field, [...eventsInfo[field], '']);
  };

  const removeListItem = (field: 'setDurations' | 'technicalRequirements', index: number) => {
    updateEventsInfoField(field, eventsInfo[field].filter((_: string, i: number) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <AdminSectionHeader
          title="EVENTS SECTION"
          description={`공연 일정 및 이벤트 정보 관리 (${currentEditLanguage.toUpperCase()})`}
          onSave={saveChanges}
          isSaving={isSaving}
          action={
            <button
              onClick={addNewPerformance}
              className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider"
              style={createBorderFaint()}
            >
              <i className="ri-add-line mr-2"></i>ADD PERFORMANCE
            </button>
          }
        />

        <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />

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

        {/* Events Information */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            EVENTS INFORMATION
          </h2>
          <AdminCard>
            <div className="space-y-6">
              <ListItemEditor
                label="SET DURATIONS"
                items={eventsInfo.setDurations}
                onUpdate={(index, value) => updateListItem('setDurations', index, value)}
                onAdd={() => addListItem('setDurations')}
                onRemove={(index) => removeListItem('setDurations', index)}
              />
              <ListItemEditor
                label="TECHNICAL REQUIREMENTS"
                items={eventsInfo.technicalRequirements}
                onUpdate={(index, value) => updateListItem('technicalRequirements', index, value)}
                onAdd={() => addListItem('technicalRequirements')}
                onRemove={(index) => removeListItem('technicalRequirements', index)}
              />
              <FormInput
                label="CONTACT EMAIL"
                type="email"
                value={eventsInfo.contactEmail}
                onChange={(value) => updateEventsInfoField('contactEmail', value)}
              />
              <FormInput
                label="RESPONSE TIME"
                value={eventsInfo.responseTime}
                onChange={(value) => updateEventsInfoField('responseTime', value)}
              />
            </div>
          </AdminCard>
        </div>

        {/* Performance Schedule */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            PERFORMANCE SCHEDULE
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
                        value={performance.time}
                        onChange={(value) => updatePerformanceField(index, 'time', value)}
                      />
                      <FormInput
                        label="VENUE"
                        value={performance.venue}
                        onChange={(value) => updatePerformanceField(index, 'venue', value)}
                      />
                      <FormInput
                        label="LOCATION"
                        value={performance.location}
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
    </AdminLayout>
  );
};

export default AdminEventsPage;
