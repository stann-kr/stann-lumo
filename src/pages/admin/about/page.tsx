import { useContent } from '../../../contexts/ContentContext';
import AdminCard from '../../../components/base/AdminCard';
import AdminSectionHeader from '../../../components/base/AdminSectionHeader';
import FormInput from '../../../components/base/FormInput';
import FormTextarea from '../../../components/base/FormTextarea';
import SuccessMessage from '../../../components/base/SuccessMessage';
import { useAdminForm } from '../../../hooks/useAdminForm';
import type { ArtistInfoItem, PhilosophyItem } from '../../../types/content';

const AdminAboutPage = () => {
  const { allContent, updateContent, currentEditLanguage } = useContent();
  const content = allContent[currentEditLanguage];

  const {
    formData,
    updateField,
    saveForm,
    isSaving,
    showSuccess,
  } = useAdminForm(content, updateContent);

  // Artist Info 관리
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
    const updated = artistInfoItems.filter(item => item.id !== id);
    updateField('artistInfo', updated);
  };

  // Biography 관리
  const paragraphs: string[] = formData.biography?.paragraphs ?? [];

  const updateParagraph = (index: number, value: string) => {
    const updated = [...paragraphs];
    updated[index] = value;
    updateField('biography', { paragraphs: updated });
  };

  const addParagraph = () => {
    updateField('biography', { paragraphs: [...paragraphs, ''] });
  };

  const removeParagraph = (index: number) => {
    if (paragraphs.length <= 1) return;
    const updated = paragraphs.filter((_, i) => i !== index);
    updateField('biography', { paragraphs: updated });
  };

  // Musical Philosophy 관리
  const philosophyItems: PhilosophyItem[] = formData.musicalPhilosophy ?? [];

  const updatePhilosophyItem = (id: string, field: 'quote' | 'description', value: string) => {
    const updated = philosophyItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('musicalPhilosophy', updated);
  };

  const addPhilosophyItem = () => {
    const newId = Date.now().toString();
    updateField('musicalPhilosophy', [...philosophyItems, { id: newId, quote: '', description: '' }]);
  };

  const removePhilosophyItem = (id: string) => {
    if (philosophyItems.length <= 1) return;
    const updated = philosophyItems.filter(item => item.id !== id);
    updateField('musicalPhilosophy', updated);
  };

  // Design Philosophy 관리
  const designParagraphs: string[] = formData.designPhilosophy?.paragraphs ?? [];

  const updateDesignParagraph = (index: number, value: string) => {
    const updated = [...designParagraphs];
    updated[index] = value;
    updateField('designPhilosophy', { paragraphs: updated });
  };

  const addDesignParagraph = () => {
    updateField('designPhilosophy', { paragraphs: [...designParagraphs, ''] });
  };

  const removeDesignParagraph = (index: number) => {
    if (designParagraphs.length <= 1) return;
    const updated = designParagraphs.filter((_, i) => i !== index);
    updateField('designPhilosophy', { paragraphs: updated });
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

        {/* Biography — 동적 단락 리스트 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider">
              BIOGRAPHY
            </h2>
            <button
              type="button"
              onClick={addParagraph}
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest font-medium border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              ADD PARAGRAPH
            </button>
          </div>

          <div className="space-y-4">
            {paragraphs.map((para, index) => (
              <AdminCard key={index}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs text-[var(--color-accent)] tracking-widest font-medium pt-1">
                    PARAGRAPH {index + 1}
                  </span>
                  {paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParagraph(index)}
                      className="flex items-center gap-1 px-3 py-1 text-xs tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line" />
                      DELETE
                    </button>
                  )}
                </div>
                <FormTextarea
                  label=""
                  value={para}
                  onChange={(value) => updateParagraph(index, value)}
                  rows={4}
                />
              </AdminCard>
            ))}
          </div>
        </div>

        {/* Musical Philosophy — 동적 항목 리스트 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider">
              MUSICAL PHILOSOPHY
            </h2>
            <button
              type="button"
              onClick={addPhilosophyItem}
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest font-medium border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              ADD ITEM
            </button>
          </div>

          <div className="space-y-4">
            {philosophyItems.map((item) => (
              <AdminCard key={item.id}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[var(--color-accent)] tracking-widest font-medium">
                    PHILOSOPHY ITEM
                  </span>
                  {philosophyItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhilosophyItem(item.id)}
                      className="flex items-center gap-1 px-3 py-1 text-xs tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line" />
                      DELETE
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <FormTextarea
                    label="QUOTE"
                    value={item.quote}
                    onChange={(value) => updatePhilosophyItem(item.id, 'quote', value)}
                    rows={3}
                  />
                  <FormTextarea
                    label="DESCRIPTION"
                    value={item.description}
                    onChange={(value) => updatePhilosophyItem(item.id, 'description', value)}
                    rows={4}
                  />
                </div>
              </AdminCard>
            ))}
          </div>
        </div>

        {/* Design Philosophy — 동적 단락 리스트 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider">
              DESIGN PHILOSOPHY
            </h2>
            <button
              type="button"
              onClick={addDesignParagraph}
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest font-medium border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              ADD PARAGRAPH
            </button>
          </div>

          <div className="space-y-4">
            {designParagraphs.map((para, index) => (
              <AdminCard key={index}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs text-[var(--color-accent)] tracking-widest font-medium pt-1">
                    PARAGRAPH {index + 1}
                  </span>
                  {designParagraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDesignParagraph(index)}
                      className="flex items-center gap-1 px-3 py-1 text-xs tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line" />
                      DELETE
                    </button>
                  )}
                </div>
                <FormTextarea
                  label=""
                  value={para}
                  onChange={(value) => updateDesignParagraph(index, value)}
                  rows={4}
                />
              </AdminCard>
            ))}
          </div>
        </div>
    </div>
  );
};

export default AdminAboutPage;