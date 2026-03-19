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
import { createBorderFaint } from '@/utils/colorMix';
import {
  updateLinkPlatforms as apiUpdateLinkPlatforms,
  updatePageMeta as apiUpdatePageMeta,
  updateTerminalInfo as apiUpdateTerminalInfo,
  fetchDisplaySettings,
  updateDisplaySettings,
} from '@/services/adminService';
import type { PageMeta } from '@/types/content';
import type { LinkDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';

const AdminLinkPage = () => {
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];
  const [linkPlatforms, setLinkPlatforms] = useState(content.linkPlatforms);
  const [terminalInfo, setTerminalInfo] = useState(content.terminalInfo);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [displaySettings, setDisplaySettings] = useState<LinkDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.link
  );
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    setLinkPlatforms(allContent[currentEditLanguage].linkPlatforms);
    setTerminalInfo(allContent[currentEditLanguage].terminalInfo);
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  useEffect(() => {
    fetchDisplaySettings('link').then((res) => {
      if (res.success && res.data) {
        setDisplaySettings(res.data as LinkDisplaySettings);
      }
    });
  }, []);

  const addNewPlatform = () => {
    setLinkPlatforms([
      ...linkPlatforms,
      {
        id: Date.now().toString(),
        platform: 'New Platform',
        url: 'https://',
        icon: 'ri-link-line',
        description: 'Platform description',
      },
    ]);
  };

  const updatePlatformField = (id: string, field: string, value: string) => {
    setLinkPlatforms(linkPlatforms.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const deletePlatform = (id: string) => {
    setLinkPlatforms(linkPlatforms.filter((p) => p.id !== id));
    setShowDeleteModal(null);
  };

  const movePlatform = (index: number, direction: 'up' | 'down') => {
    const newPlatforms = [...linkPlatforms];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPlatforms.length) return;
    [newPlatforms[index], newPlatforms[targetIndex]] = [newPlatforms[targetIndex], newPlatforms[index]];
    setLinkPlatforms(newPlatforms);
  };

  const updatePageMetaField = (field: keyof PageMeta['link'], value: string) => {
    setPageMeta(prev => ({ ...prev, link: { ...prev.link, [field]: value } }));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    await Promise.allSettled([
      apiUpdateLinkPlatforms(currentEditLanguage, linkPlatforms),
      apiUpdatePageMeta(currentEditLanguage, pageMeta),
      apiUpdateTerminalInfo(terminalInfo),
      updateDisplaySettings('link', displaySettings),
    ]);
    updateContent({ linkPlatforms, terminalInfo, pageMeta });
    showNotification();
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
        <AdminSectionHeader
          title="LINK SECTION"
          description={`소셜 미디어 및 플랫폼 링크 관리 (${currentEditLanguage.toUpperCase()})`}
          onSave={saveChanges}
          isSaving={isSaving}
          action={
            <button
              onClick={addNewPlatform}
              className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors whitespace-nowrap cursor-pointer text-sm tracking-wider"
              style={createBorderFaint()}
            >
              <i className="ri-add-line mr-2"></i>ADD PLATFORM
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
                label="GRID COLUMNS"
                value={displaySettings.gridColumns}
                options={[
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, gridColumns: v }))}
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
                label="GRID GAP"
                value={displaySettings.gridGap}
                options={[
                  { value: 'sm', label: 'SM' },
                  { value: 'md', label: 'MD' },
                  { value: 'lg', label: 'LG' },
                ]}
                onChange={(v) => setDisplaySettings((prev) => ({ ...prev, gridGap: v }))}
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displaySettings.showTerminalCard}
                  onChange={(e) => setDisplaySettings((prev) => ({ ...prev, showTerminalCard: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                />
                <span className="text-xs text-[var(--color-secondary)] tracking-widest">SHOW TERMINAL CARD</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="PAGE TITLE"
                value={pageMeta.link.title}
                onChange={(value) => updatePageMetaField('title', value)}
                placeholder="CONNECT"
              />
              <FormInput
                label="PAGE SUBTITLE"
                value={pageMeta.link.subtitle}
                onChange={(value) => updatePageMetaField('subtitle', value)}
                placeholder="SOCIAL MEDIA & PLATFORMS"
              />
              <FormInput
                label="TERMINAL CARD TITLE"
                value={pageMeta.link.terminalTitle}
                onChange={(value) => updatePageMetaField('terminalTitle', value)}
                placeholder="TERMINAL.STANN.KR"
              />
            </div>
          </AdminCard>
        </div>

        {/* Terminal Section */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            TERMINAL PROJECT
          </h2>
          <AdminCard>
            <div className="space-y-4">
              <FormInput
                label="URL"
                value={terminalInfo.url}
                onChange={(value) => setTerminalInfo({ ...terminalInfo, url: value })}
              />
              <FormTextarea
                label="DESCRIPTION"
                value={terminalInfo.description}
                onChange={(value) => setTerminalInfo({ ...terminalInfo, description: value })}
                rows={3}
              />
            </div>
          </AdminCard>
        </div>

        {/* Platform Links */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            PLATFORM LINKS
          </h2>
          <div className="space-y-4">
            {linkPlatforms.map((platform, index) => (
              <AdminCard key={platform.id}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-[var(--color-accent)] tracking-widest">
                    PLATFORM #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => movePlatform(index, 'up')}
                      disabled={index === 0}
                      className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      style={createBorderFaint()}
                    >
                      <i className="ri-arrow-up-line"></i>
                    </button>
                    <button
                      onClick={() => movePlatform(index, 'down')}
                      disabled={index === linkPlatforms.length - 1}
                      className="w-8 h-8 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      style={createBorderFaint()}
                    >
                      <i className="ri-arrow-down-line"></i>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(platform.id)}
                      className="w-8 h-8 flex items-center justify-center border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label="PLATFORM NAME"
                      value={platform.platform}
                      onChange={(value) => updatePlatformField(platform.id, 'platform', value)}
                    />
                    <FormInput
                      label="ICON CLASS"
                      value={platform.icon}
                      onChange={(value) => updatePlatformField(platform.id, 'icon', value)}
                      placeholder="ri-link-line"
                    />
                  </div>
                  <FormInput
                    label="URL"
                    value={platform.url}
                    onChange={(value) => updatePlatformField(platform.id, 'url', value)}
                  />
                  <FormInput
                    label="DESCRIPTION"
                    value={platform.description}
                    onChange={(value) => updatePlatformField(platform.id, 'description', value)}
                  />
                </div>
              </AdminCard>
            ))}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <DeleteConfirmModal
            show={true}
            itemName={linkPlatforms.find((p) => p.id === showDeleteModal)?.platform || ''}
            onConfirm={() => deletePlatform(showDeleteModal)}
            onCancel={() => setShowDeleteModal(null)}
          />
        )}
    </div>
  );
};

export default AdminLinkPage;
