'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import ListItemEditor from '@/components/base/ListItemEditor';
import SuccessMessage from '@/components/base/SuccessMessage';
import RadioGroup from '@/components/base/RadioGroup';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import {
  updateContactInfo as apiUpdateContactInfo,
  updateEventsInfo as apiUpdateEventsInfo,
  updatePageMeta as apiUpdatePageMeta,
  fetchDisplaySettings,
  updateDisplaySettings,
} from '@/services/adminService';
import type { ContactItem, EventsInfo, PageMeta } from '@/types/content';
import type { ContactDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';

const AVAILABLE_ICONS = [
  { value: 'ri-mail-line', label: 'Email' },
  { value: 'ri-calendar-line', label: 'Calendar' },
  { value: 'ri-time-line', label: 'Time' },
  { value: 'ri-phone-line', label: 'Phone' },
  { value: 'ri-map-pin-line', label: 'Location' },
  { value: 'ri-user-line', label: 'User' },
  { value: 'ri-message-line', label: 'Message' },
  { value: 'ri-global-line', label: 'Global' },
  { value: 'ri-links-line', label: 'Link' },
  { value: 'ri-information-line', label: 'Info' },
  { value: 'ri-instagram-line', label: 'Instagram' },
  { value: 'ri-facebook-line', label: 'Facebook' },
  { value: 'ri-twitter-line', label: 'Twitter' },
  { value: 'ri-linkedin-line', label: 'LinkedIn' },
  { value: 'ri-youtube-line', label: 'YouTube' },
  { value: 'ri-soundcloud-line', label: 'SoundCloud' },
  { value: 'ri-spotify-line', label: 'Spotify' },
  { value: 'ri-briefcase-line', label: 'Briefcase' },
];

const AdminContactPage = () => {
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];
  const [contactInfo, setContactInfo] = useState<ContactItem[]>(content.contactInfo);
  const [eventsInfo, setEventsInfo] = useState<EventsInfo>(content.eventsInfo);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [displaySettings, setDisplaySettings] = useState<ContactDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.contact
  );
  const [isSaving, setIsSaving] = useState(false);
  const [iconSelectorOpen, setIconSelectorOpen] = useState<number | null>(null);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    setContactInfo(allContent[currentEditLanguage].contactInfo);
    setEventsInfo(allContent[currentEditLanguage].eventsInfo);
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  useEffect(() => {
    fetchDisplaySettings('contact').then((res) => {
      if (res.success && res.data) {
        setDisplaySettings(res.data as ContactDisplaySettings);
      }
    });
  }, []);

  const updateContactItemField = (index: number, field: keyof ContactItem, value: string) => {
    setContactInfo(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addContactItem = () => {
    setContactInfo(prev => [...prev, { label: '', value: '', icon: 'ri-mail-line' }]);
  };

  const deleteContactItem = (index: number) => {
    setContactInfo(prev => prev.filter((_, i) => i !== index));
  };

  const moveContactItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contactInfo.length) return;
    const updated = [...contactInfo];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setContactInfo(updated);
  };

  const updateEventsInfoField = (field: keyof Pick<EventsInfo, 'contactEmail' | 'responseTime'>, value: string) => {
    setEventsInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateListItem = (field: keyof Pick<EventsInfo, 'setDurations' | 'technicalRequirements'>, index: number, value: string) => {
    setEventsInfo(prev => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const addListItem = (field: keyof Pick<EventsInfo, 'setDurations' | 'technicalRequirements'>) => {
    setEventsInfo(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeListItem = (field: keyof Pick<EventsInfo, 'setDurations' | 'technicalRequirements'>, index: number) => {
    setEventsInfo(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const updatePageMetaField = (field: keyof PageMeta['contact'], value: string) => {
    setPageMeta(prev => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    await Promise.allSettled([
      apiUpdateContactInfo(currentEditLanguage, contactInfo),
      apiUpdateEventsInfo(currentEditLanguage, eventsInfo),
      apiUpdatePageMeta(currentEditLanguage, pageMeta),
      updateDisplaySettings('contact', displaySettings),
    ]);
    updateContent({ contactInfo, eventsInfo, pageMeta });
    showNotification();
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
        <AdminSectionHeader
          title="CONTACT SECTION"
          description={`연락처 정보 편집 (${currentEditLanguage.toUpperCase()})`}
          onSave={saveChanges}
          isSaving={isSaving}
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
                label="CONTACT INFO COLUMNS"
                value={displaySettings.contactInfoColumns}
                options={[
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, contactInfoColumns: v }))}
              />
              <RadioGroup
                label="BOOKING COLUMNS"
                value={displaySettings.bookingColumns}
                options={[
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, bookingColumns: v }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="MESSAGE MAX LENGTH"
                  type="number"
                  value={String(displaySettings.messageMaxLength)}
                  onChange={(v) => setDisplaySettings((prev) => ({ ...prev, messageMaxLength: Math.max(100, parseInt(v) || 100) }))}
                />
                <FormInput
                  label="TEXTAREA ROWS"
                  type="number"
                  value={String(displaySettings.textareaRows)}
                  onChange={(v) => setDisplaySettings((prev) => ({ ...prev, textareaRows: Math.max(2, parseInt(v) || 2) }))}
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
                value={pageMeta.contact.title}
                onChange={(value) => updatePageMetaField('title', value)}
                placeholder="CONTACT"
              />
              <FormInput
                label="PAGE SUBTITLE"
                value={pageMeta.contact.subtitle}
                onChange={(value) => updatePageMetaField('subtitle', value)}
                placeholder="GUESTBOOK & DIRECT CONTACT"
              />
              <FormInput
                label="GUESTBOOK SECTION TITLE"
                value={pageMeta.contact.guestbookTitle}
                onChange={(value) => updatePageMetaField('guestbookTitle', value)}
                placeholder="GUESTBOOK"
              />
              <FormInput
                label="DIRECT CONTACT SECTION TITLE"
                value={pageMeta.contact.directTitle}
                onChange={(value) => updatePageMetaField('directTitle', value)}
                placeholder="DIRECT CONTACT"
              />
              <FormInput
                label="BOOKING SECTION TITLE"
                value={pageMeta.contact.bookingTitle}
                onChange={(value) => updatePageMetaField('bookingTitle', value)}
                placeholder="BOOKING INFO"
              />
            </div>
          </AdminCard>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            CONTACT INFORMATION
          </h2>
          <AdminCard>
            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="bg-[var(--color-secondary)]/5 border p-4" style={createBorderFaint()}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Icon Selector */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--color-accent)] mb-2 tracking-wider">ICON</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIconSelectorOpen(iconSelectorOpen === index ? null : index)}
                          className="w-full bg-[var(--color-bg)] border text-[var(--color-secondary)] px-3 py-2 text-sm focus:outline-none cursor-pointer flex items-center justify-between"
                          style={createBorderFaint()}
                        >
                          <div className="flex items-center gap-2">
                            <i className={`${item.icon} text-lg text-[var(--color-accent)]`}></i>
                            <span className="text-xs">{AVAILABLE_ICONS.find(ic => ic.value === item.icon)?.label}</span>
                          </div>
                          <i className="ri-arrow-down-s-line text-[var(--color-muted)]"></i>
                        </button>

                        {/* Icon Grid Popup */}
                        {iconSelectorOpen === index && (
                          <div className="absolute z-50 mt-1 w-64 bg-[var(--color-bg)] border shadow-lg p-3" style={createBorderFaint()}>
                            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                              {AVAILABLE_ICONS.map((icon) => (
                                <button
                                  key={icon.value}
                                  type="button"
                                  onClick={() => {
                                    updateContactItemField(index, 'icon', icon.value);
                                    setIconSelectorOpen(null);
                                  }}
                                  className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${
                                    item.icon === icon.value
                                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]'
                                      : 'hover:bg-[var(--color-secondary)]/10'
                                  }`}
                                  style={createBorderFaint()}
                                  title={icon.label}
                                >
                                  <i className={`${icon.value} text-lg text-[var(--color-accent)]`}></i>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Label */}
                    <div className="md:col-span-3">
                      <FormInput
                        label="LABEL"
                        value={item.label}
                        onChange={(value) => updateContactItemField(index, 'label', value)}
                      />
                    </div>

                    {/* Value */}
                    <div className="md:col-span-5">
                      <FormInput
                        label="VALUE"
                        value={item.value}
                        onChange={(value) => updateContactItemField(index, 'value', value)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex items-end gap-2 pt-6">
                      <button
                        onClick={() => moveContactItem(index, 'up')}
                        disabled={index === 0}
                        className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        style={createBorderFaint()}
                        title="위로 이동"
                      >
                        <i className="ri-arrow-up-line"></i>
                      </button>
                      <button
                        onClick={() => moveContactItem(index, 'down')}
                        disabled={index === contactInfo.length - 1}
                        className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        style={createBorderFaint()}
                        title="아래로 이동"
                      >
                        <i className="ri-arrow-down-line"></i>
                      </button>
                      <button
                        onClick={() => deleteContactItem(index)}
                        className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer"
                        title="삭제"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Button */}
              <button
                onClick={addContactItem}
                className="w-full px-4 py-3 border border-dashed text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors text-sm tracking-wider cursor-pointer whitespace-nowrap"
                style={createBorderMid()}
              >
                <i className="ri-add-line mr-2"></i>
                ADD ITEM
              </button>
            </div>
          </AdminCard>
        </div>

        {/* Booking Info */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            BOOKING INFO
          </h2>
          <AdminCard className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t" style={createBorderFaint()}>
              <FormInput
                label="CONTACT EMAIL"
                value={eventsInfo.contactEmail}
                onChange={(value) => updateEventsInfoField('contactEmail', value)}
                placeholder="booking@example.com"
              />
              <FormInput
                label="RESPONSE TIME"
                value={eventsInfo.responseTime}
                onChange={(value) => updateEventsInfoField('responseTime', value)}
                placeholder="Within 48 hours"
              />
            </div>
          </AdminCard>
        </div>
    </div>
  );
};

export default AdminContactPage;
