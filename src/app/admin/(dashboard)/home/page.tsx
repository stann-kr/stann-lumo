'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormTextarea from '@/components/base/FormTextarea';
import SuccessMessage from '@/components/base/SuccessMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import RadioGroup from '@/components/base/RadioGroup';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import {
  updateHomeSections as apiUpdateHomeSections,
  updatePageMeta as apiUpdatePageMeta,
  updateTerminalInfo as apiUpdateTerminalInfo,
  fetchDisplaySettings,
  updateDisplaySettings,
} from '@/services/adminService';
import type { HomeSection, TerminalInfo, PageMeta } from '@/types/content';
import type { HomeDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';

const AVAILABLE_ICONS = [
  { value: 'ri-user-line', label: 'User' },
  { value: 'ri-music-2-line', label: 'Music' },
  { value: 'ri-calendar-event-line', label: 'Calendar' },
  { value: 'ri-mail-line', label: 'Mail' },
  { value: 'ri-links-line', label: 'Links' },
  { value: 'ri-star-line', label: 'Star' },
  { value: 'ri-heart-line', label: 'Heart' },
  { value: 'ri-image-line', label: 'Image' },
  { value: 'ri-video-line', label: 'Video' },
  { value: 'ri-mic-line', label: 'Mic' },
  { value: 'ri-headphone-line', label: 'Headphone' },
  { value: 'ri-global-line', label: 'Global' },
  { value: 'ri-map-pin-line', label: 'Location' },
  { value: 'ri-information-line', label: 'Info' },
  { value: 'ri-settings-line', label: 'Settings' },
  { value: 'ri-file-text-line', label: 'File' },
  { value: 'ri-instagram-line', label: 'Instagram' },
  { value: 'ri-soundcloud-line', label: 'SoundCloud' },
  { value: 'ri-arrow-right-line', label: 'Arrow' },
  { value: 'ri-compass-3-line', label: 'Compass' },
];

const AdminHomePage = () => {
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];

  const [homeSections, setHomeSections] = useState<HomeSection[]>(content.homeSections);
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo>(content.terminalInfo);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [displaySettings, setDisplaySettings] = useState<HomeDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.home
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [iconSelectorOpen, setIconSelectorOpen] = useState<number | null>(null);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    setHomeSections(allContent[currentEditLanguage].homeSections);
    setTerminalInfo(allContent[currentEditLanguage].terminalInfo);
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  useEffect(() => {
    fetchDisplaySettings('home').then((res) => {
      if (res.success && res.data) {
        setDisplaySettings(res.data as HomeDisplaySettings);
      }
    });
  }, []);

  const updateSectionField = (index: number, field: keyof HomeSection, value: string) => {
    setHomeSections(prev =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSection = () => {
    setHomeSections(prev => [
      ...prev,
      {
        title: 'NEW SECTION',
        description: 'Description',
        path: '/new',
        icon: 'ri-star-line',
      },
    ]);
  };

  const deleteSection = (index: number) => {
    setHomeSections(prev => prev.filter((_, i) => i !== index));
    setShowDeleteModal(null);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= homeSections.length) return;
    const updated = [...homeSections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setHomeSections(updated);
  };

  const updatePageMetaField = (field: keyof PageMeta['home'], value: string) => {
    setPageMeta(prev => ({ ...prev, home: { ...prev.home, [field]: value } }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    await Promise.allSettled([
      apiUpdateHomeSections(currentEditLanguage, homeSections),
      apiUpdatePageMeta(currentEditLanguage, pageMeta),
      apiUpdateTerminalInfo(terminalInfo),
      updateDisplaySettings('home', displaySettings),
    ]);
    updateContent({ homeSections, terminalInfo, pageMeta });
    showNotification();
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
        <AdminSectionHeader
          title="HOME SECTION"
          description={`홈 화면 네비게이션 카드 및 터미널 정보 관리 (${currentEditLanguage.toUpperCase()})`}
          onSave={saveChanges}
          isSaving={isSaving}
          action={
            <button
              onClick={addSection}
              className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider"
              style={createBorderFaint()}
            >
              <i className="ri-add-line mr-2"></i>ADD CARD
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
                label="NAV GRID COLUMNS"
                value={displaySettings.navGridColumns}
                options={[
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, navGridColumns: v }))}
              />
              <RadioGroup
                label="NAV CARD PADDING"
                value={displaySettings.navCardPadding}
                options={[
                  { value: 'sm', label: 'SM' },
                  { value: 'md', label: 'MD' },
                  { value: 'lg', label: 'LG' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, navCardPadding: v }))}
              />
              <RadioGroup
                label="NAV GRID GAP"
                value={displaySettings.navGridGap}
                options={[
                  { value: 'sm', label: 'SM' },
                  { value: 'md', label: 'MD' },
                  { value: 'lg', label: 'LG' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, navGridGap: v }))}
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displaySettings.showTerminalInfo}
                  onChange={(e) => setDisplaySettings((prev) => ({ ...prev, showTerminalInfo: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                />
                <span className="text-xs text-[var(--color-secondary)] tracking-widest">SHOW TERMINAL INFO</span>
              </label>
            </div>
          </AdminCard>
        </div>

        {/* PAGE SETTINGS */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            PAGE SETTINGS
          </h2>
          <AdminCard>
            <div className="space-y-4">
              <FormInput
                label="NAVIGATION TITLE"
                value={pageMeta.home.navTitle}
                onChange={(value) => updatePageMetaField('navTitle', value)}
                placeholder="NAVIGATION"
              />
            </div>
          </AdminCard>
        </div>

        {/* Terminal Info */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            TERMINAL INFO
          </h2>
          <AdminCard>
            <div className="space-y-4">
              <FormInput
                label="URL"
                value={terminalInfo.url}
                onChange={(value) => setTerminalInfo(prev => ({ ...prev, url: value }))}
                placeholder="https://example.com"
              />
              <FormTextarea
                label="DESCRIPTION"
                value={terminalInfo.description}
                onChange={(value) => setTerminalInfo(prev => ({ ...prev, description: value }))}
                rows={3}
              />
            </div>
          </AdminCard>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            NAVIGATION CARDS
          </h2>
          <div className="space-y-4">
            {homeSections.map((section, index) => (
              <AdminCard key={index}>
                {showDeleteModal === index ? (
                  <DeleteConfirmModal
                    show={true}
                    itemName={section.title}
                    onConfirm={() => deleteSection(index)}
                    onCancel={() => setShowDeleteModal(null)}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--color-accent)] tracking-widest font-medium">
                          CARD #{index + 1}
                        </span>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <i className={`${section.icon} text-lg`} style={{ color: 'var(--color-accent)' }} />
                        </div>
                        <span className="text-sm text-[var(--color-secondary)] tracking-wider font-medium">
                          {section.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          style={createBorderFaint()}
                          title="위로 이동"
                        >
                          <i className="ri-arrow-up-line" />
                        </button>
                        <button
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === homeSections.length - 1}
                          className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          style={createBorderFaint()}
                          title="아래로 이동"
                        >
                          <i className="ri-arrow-down-line" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(index)}
                          className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="TITLE"
                        value={section.title}
                        onChange={(value) => updateSectionField(index, 'title', value)}
                        placeholder="ABOUT"
                      />
                      <FormInput
                        label="PATH"
                        value={section.path}
                        onChange={(value) => updateSectionField(index, 'path', value)}
                        placeholder="/about"
                      />
                    </div>

                    <FormInput
                      label="DESCRIPTION"
                      value={section.description}
                      onChange={(value) => updateSectionField(index, 'description', value)}
                      placeholder="Short description"
                    />

                    {/* Icon Selector */}
                    <div>
                      <label className="block text-xs text-[var(--color-accent)] tracking-widest mb-2">ICON</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIconSelectorOpen(iconSelectorOpen === index ? null : index)}
                          className="w-full bg-[var(--color-bg)] border text-[var(--color-secondary)] px-3 py-2 text-sm focus:outline-none cursor-pointer flex items-center justify-between"
                          style={createBorderFaint()}
                        >
                          <div className="flex items-center gap-3">
                            <i className={`${section.icon} text-lg`} style={{ color: 'var(--color-accent)' }} />
                            <span className="text-xs tracking-wider">
                              {AVAILABLE_ICONS.find(ic => ic.value === section.icon)?.label ?? section.icon}
                            </span>
                            <span className="text-xs opacity-40">{section.icon}</span>
                          </div>
                          <i className="ri-arrow-down-s-line text-[var(--color-muted)]" />
                        </button>

                        {iconSelectorOpen === index && (
                          <div
                            className="absolute z-50 mt-1 w-full bg-[var(--color-bg)] border shadow-lg p-3"
                            style={createBorderFaint()}
                          >
                            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                              {AVAILABLE_ICONS.map((icon) => (
                                <button
                                  key={icon.value}
                                  type="button"
                                  onClick={() => {
                                    updateSectionField(index, 'icon', icon.value);
                                    setIconSelectorOpen(null);
                                  }}
                                  className={`w-10 h-10 flex items-center justify-center border transition-colors cursor-pointer ${
                                    section.icon === icon.value
                                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]'
                                      : 'hover:bg-[var(--color-secondary)]/10'
                                  }`}
                                  style={createBorderFaint()}
                                  title={icon.label}
                                >
                                  <i className={`${icon.value} text-lg`} style={{ color: 'var(--color-accent)' }} />
                                </button>
                              ))}
                            </div>
                            {/* Custom icon input */}
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--color-secondary) 15%, transparent)' }}>
                              <p className="text-xs text-[var(--color-muted)] tracking-wider mb-2">직접 입력 (Remix Icon 클래스명)</p>
                              <input
                                type="text"
                                placeholder="ri-custom-line"
                                defaultValue={section.icon}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateSectionField(index, 'icon', (e.target as HTMLInputElement).value);
                                    setIconSelectorOpen(null);
                                  }
                                }}
                                className="w-full bg-transparent border-b text-[var(--color-secondary)] text-sm py-1 focus:outline-none tracking-wider"
                                style={{ borderColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    <div
                      className="p-4 border"
                      style={createBorderMid()}
                    >
                      <p className="text-xs text-[var(--color-muted)] tracking-widest mb-3">PREVIEW</p>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 flex items-center justify-center">
                              <i className={`${section.icon} text-base`} style={{ color: 'var(--color-accent)' }} />
                            </div>
                            <span
                              className="text-sm font-semibold tracking-widest"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {section.title || 'TITLE'}
                            </span>
                          </div>
                          <p
                            className="text-xs leading-relaxed pl-8"
                            style={{ color: 'var(--color-secondary)', opacity: 0.55 }}
                          >
                            {section.description || 'Description'}
                          </p>
                        </div>
                        <i className="ri-arrow-right-line text-sm" style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
                      </div>
                    </div>
                  </div>
                )}
              </AdminCard>
            ))}
          </div>
        </div>
    </div>
  );
};

export default AdminHomePage;
