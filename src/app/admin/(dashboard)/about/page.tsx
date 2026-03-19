'use client';
import { useState, useCallback, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormTextarea from '@/components/base/FormTextarea';
import SuccessMessage from '@/components/base/SuccessMessage';
import RadioGroup from '@/components/base/RadioGroup';
import { useAdminForm } from '@/hooks/useAdminForm';
import {
  updateArtistInfo as apiUpdateArtistInfo,
  updateAboutSections as apiUpdateAboutSections,
  fetchDisplaySettings,
  updateDisplaySettings,
} from '@/services/adminService';
import type { ArtistInfoItem, ContentData, DynamicSection, DynamicSectionType, PhilosophyItem } from '@/types/content';
import type { AboutDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';
import { createBorderFaint } from '@/utils/colorMix';

const AdminAboutPage = () => {
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];

  const [displaySettings, setDisplaySettings] = useState<AboutDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.about
  );

  useEffect(() => {
    fetchDisplaySettings('about').then((res) => {
      if (res.success && res.data) {
        setDisplaySettings(res.data as AboutDisplaySettings);
      }
    });
  }, []);

  const handleSave = useCallback(async (data: ContentData) => {
    await Promise.allSettled([
      apiUpdateArtistInfo(currentEditLanguage, data.artistInfo),
      apiUpdateAboutSections(currentEditLanguage, data.aboutSections),
      updateDisplaySettings('about', displaySettings),
    ]);
    updateContent(data);
  }, [currentEditLanguage, updateContent, displaySettings]);

  const {
    formData,
    updateField,
    saveForm,
    isSaving,
    showSuccess,
  } = useAdminForm(content, handleSave);

  const [addSectionOpen, setAddSectionOpen] = useState(false);

  // ──────────────────────────────────────────
  // Artist Info 관리
  // ──────────────────────────────────────────
  const artistInfoItems: ArtistInfoItem[] = formData.artistInfo ?? [];

  const updateArtistInfoItem = (id: string, field: 'key' | 'value', value: string) => {
    const updated = artistInfoItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('artistInfo', updated);
  };

  const addArtistInfoItem = () => {
    const newId = Date.now().toString();
    updateField('artistInfo', [...artistInfoItems, { id: newId, key: '', value: '' }]);
  };

  const removeArtistInfoItem = (id: string) => {
    if (artistInfoItems.length <= 1) return;
    updateField('artistInfo', artistInfoItems.filter(item => item.id !== id));
  };

  // ──────────────────────────────────────────
  // 동적 섹션 관리
  // ──────────────────────────────────────────
  const sections: DynamicSection[] = [...(formData.aboutSections ?? [])].sort((a, b) => a.order - b.order);

  const addSection = (type: DynamicSectionType) => {
    const newSection: DynamicSection = {
      id: Date.now().toString(),
      title: 'NEW SECTION',
      type,
      order: sections.length,
      paragraphs: type === 'paragraphs' ? [''] : undefined,
      items: type === 'philosophy-items'
        ? [{ id: Date.now().toString(), quote: '', description: '' }]
        : undefined,
    };
    updateField('aboutSections', [...(formData.aboutSections ?? []), newSection]);
    setAddSectionOpen(false);
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) return;
    const filtered = sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i }));
    updateField('aboutSections', filtered);
  };

  const updateSectionTitle = (id: string, title: string) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s =>
      s.id === id ? { ...s, title } : s
    ));
  };

  const updateSectionType = (id: string, type: DynamicSectionType) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s =>
      s.id === id ? {
        ...s,
        type,
        paragraphs: type === 'paragraphs' ? (s.paragraphs ?? ['']) : undefined,
        items: type === 'philosophy-items'
          ? (s.items ?? [{ id: Date.now().toString(), quote: '', description: '' }])
          : undefined,
      } : s
    ));
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updateField('aboutSections', updated.map((s, i) => ({ ...s, order: i })));
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updateField('aboutSections', updated.map((s, i) => ({ ...s, order: i })));
  };

  // 단락(paragraphs) 관리
  const updateParagraph = (sectionId: string, idx: number, value: string) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s => {
      if (s.id !== sectionId) return s;
      const updated = [...(s.paragraphs ?? [])];
      updated[idx] = value;
      return { ...s, paragraphs: updated };
    }));
  };

  const addParagraph = (sectionId: string) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s =>
      s.id === sectionId ? { ...s, paragraphs: [...(s.paragraphs ?? []), ''] } : s
    ));
  };

  const removeParagraph = (sectionId: string, idx: number) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s => {
      if (s.id !== sectionId) return s;
      if ((s.paragraphs ?? []).length <= 1) return s;
      return { ...s, paragraphs: (s.paragraphs ?? []).filter((_, i) => i !== idx) };
    }));
  };

  // philosophy-items 관리
  const updatePhilosophyItem = (sectionId: string, itemId: string, field: 'quote' | 'description', value: string) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: (s.items ?? []).map((item: PhilosophyItem) =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      };
    }));
  };

  const addPhilosophyItem = (sectionId: string) => {
    const newItem: PhilosophyItem = { id: Date.now().toString(), quote: '', description: '' };
    updateField('aboutSections', (formData.aboutSections ?? []).map(s =>
      s.id === sectionId ? { ...s, items: [...(s.items ?? []), newItem] } : s
    ));
  };

  const removePhilosophyItem = (sectionId: string, itemId: string) => {
    updateField('aboutSections', (formData.aboutSections ?? []).map(s => {
      if (s.id !== sectionId) return s;
      if ((s.items ?? []).length <= 1) return s;
      return { ...s, items: (s.items ?? []).filter((item: PhilosophyItem) => item.id !== itemId) };
    }));
  };

  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="ABOUT SECTION"
        description={`아티스트 정보, 약력, 철학 편집 (${currentEditLanguage.toUpperCase()})`}
        onSave={saveForm}
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
              label="INFO GRID COLUMNS"
              value={displaySettings.infoGridColumns}
              options={[
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
              ]}
              onChange={(v) => setDisplaySettings((prev) => ({ ...prev, infoGridColumns: v }))}
            />
            <RadioGroup
              label="INFO CARD GAP"
              value={displaySettings.infoCardGap}
              options={[
                { value: 'sm', label: 'SM' },
                { value: 'md', label: 'MD' },
                { value: 'lg', label: 'LG' },
              ]}
              onChange={(v) => setDisplaySettings((prev) => ({ ...prev, infoCardGap: v }))}
            />
            <FormInput
              label="TYPING SPEED (MS/CHAR)"
              type="number"
              value={String(displaySettings.typingSpeed)}
              onChange={(v) => setDisplaySettings((prev) => ({ ...prev, typingSpeed: Math.max(1, parseInt(v) || 1) }))}
            />
          </div>
        </AdminCard>
      </div>

      {/* Artist Info — 동적 key-value 리스트 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider">
            ARTIST INFO
          </h2>
          <button
            type="button"
            onClick={addArtistInfoItem}
            className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest font-medium border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" />
            ADD FIELD
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {artistInfoItems.map((item) => (
            <AdminCard key={item.id}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--color-accent)] tracking-widest font-medium">
                  FIELD
                </span>
                {artistInfoItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArtistInfoItem(item.id)}
                    className="flex items-center gap-1 px-3 py-1 text-xs tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-delete-bin-line" />
                    DELETE
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <FormInput
                  label="LABEL"
                  value={item.key}
                  onChange={(value) => updateArtistInfoItem(item.id, 'key', value)}
                />
                <FormInput
                  label="VALUE"
                  value={item.value}
                  onChange={(value) => updateArtistInfoItem(item.id, 'value', value)}
                />
              </div>
            </AdminCard>
          ))}
        </div>
      </div>

      {/* 동적 섹션 관리 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider">
            ABOUT SECTIONS
          </h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddSectionOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest font-medium border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              ADD SECTION ▼
            </button>
            {addSectionOpen && (
              <div
                className="absolute right-0 mt-1 w-48 bg-[var(--color-bg)] border shadow-lg z-50"
                style={createBorderFaint()}
              >
                <button
                  type="button"
                  onClick={() => addSection('paragraphs')}
                  className="w-full px-4 py-3 text-xs tracking-widest text-left text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors cursor-pointer"
                >
                  Paragraphs
                </button>
                <button
                  type="button"
                  onClick={() => addSection('philosophy-items')}
                  className="w-full px-4 py-3 text-xs tracking-widest text-left text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors cursor-pointer"
                >
                  Philosophy Items
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <AdminCard key={section.id}>
              {/* 섹션 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveSectionUp(index)}
                      disabled={index === 0}
                      className="w-6 h-6 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      style={createBorderFaint()}
                      title="위로 이동"
                    >
                      <i className="ri-arrow-up-line text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSectionDown(index)}
                      disabled={index === sections.length - 1}
                      className="w-6 h-6 flex items-center justify-center border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      style={createBorderFaint()}
                      title="아래로 이동"
                    >
                      <i className="ri-arrow-down-line text-xs" />
                    </button>
                  </div>
                  <span className="text-xs text-[var(--color-accent)] tracking-widest font-medium">
                    SECTION #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* 타입 선택 */}
                  <select
                    value={section.type}
                    onChange={(e) => updateSectionType(section.id, e.target.value as DynamicSectionType)}
                    className="bg-[var(--color-bg)] border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] text-xs tracking-wider px-3 py-1.5 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="paragraphs">paragraphs</option>
                    <option value="philosophy-items">philosophy-items</option>
                  </select>

                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line" />
                      DELETE
                    </button>
                  )}
                </div>
              </div>

              {/* 섹션 타이틀 */}
              <div className="mb-4">
                <FormInput
                  label="TITLE"
                  value={section.title}
                  onChange={(value) => updateSectionTitle(section.id, value)}
                />
              </div>

              {/* paragraphs 타입 */}
              {section.type === 'paragraphs' && (
                <div className="space-y-3">
                  <label className="block text-xs text-[var(--color-accent)] tracking-widest">PARAGRAPHS</label>
                  {(section.paragraphs ?? []).map((para, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <FormTextarea
                        label=""
                        value={para}
                        onChange={(value) => updateParagraph(section.id, idx, value)}
                        rows={3}
                      />
                      {(section.paragraphs ?? []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParagraph(section.id, idx)}
                          className="mt-1 w-7 h-7 flex items-center justify-center border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          <i className="ri-close-line text-xs" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addParagraph(section.id)}
                    className="text-xs text-[var(--color-accent)] tracking-widest hover:underline cursor-pointer"
                  >
                    + ADD PARAGRAPH
                  </button>
                </div>
              )}

              {/* philosophy-items 타입 */}
              {section.type === 'philosophy-items' && (
                <div className="space-y-4">
                  <label className="block text-xs text-[var(--color-accent)] tracking-widest">ITEMS</label>
                  {(section.items ?? []).map((item: PhilosophyItem) => (
                    <div key={item.id} className="border p-4 space-y-3" style={createBorderFaint()}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-accent)] tracking-widest">ITEM</span>
                        {(section.items ?? []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhilosophyItem(section.id, item.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <i className="ri-close-line" />
                          </button>
                        )}
                      </div>
                      <FormTextarea
                        label="QUOTE"
                        value={item.quote}
                        onChange={(value) => updatePhilosophyItem(section.id, item.id, 'quote', value)}
                        rows={2}
                      />
                      <FormTextarea
                        label="DESCRIPTION"
                        value={item.description}
                        onChange={(value) => updatePhilosophyItem(section.id, item.id, 'description', value)}
                        rows={3}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addPhilosophyItem(section.id)}
                    className="text-xs text-[var(--color-accent)] tracking-widest hover:underline cursor-pointer"
                  >
                    + ADD ITEM
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

export default AdminAboutPage;
