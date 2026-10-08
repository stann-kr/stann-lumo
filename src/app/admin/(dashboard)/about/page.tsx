"use client";
import { useState, useCallback } from "react";
import { useContent } from "@/contexts/ContentContext";
import AdminCard from "@/components/base/AdminCard";
import AdminSectionHeader from "@/components/base/AdminSectionHeader";
import FormInput from "@/components/base/FormInput";
import FormTextarea from "@/components/base/FormTextarea";
import FormSelect from "@/components/base/FormSelect";
import SuccessMessage from "@/components/base/SuccessMessage";
import SaveErrorMessage from "@/components/base/SaveErrorMessage";
import DeleteConfirmModal from "@/components/base/DeleteConfirmModal";
import { useAdminForm } from "@/capabilities/admin/useAdminForm";
import {
  updateArtistInfo as apiUpdateArtistInfo,
  updateAboutSections as apiUpdateAboutSections,
} from "@/capabilities/content/contentAdmin.client";
import type {
  ArtistInfoItem,
  ContentData,
  DynamicSection,
  DynamicSectionType,
  PhilosophyItem,
} from "@/capabilities/content/content";
import AdminEditorItem from "@/capabilities/admin/AdminEditorItem";
import collection from "@/capabilities/admin/AdminCollection.module.css";
import { runSave } from "@/capabilities/admin/saveResult";

type PendingDelete =
  | { kind: "artist"; id: string; name: string }
  | { kind: "section"; id: string; name: string };

const AdminAboutPage = () => {
  const { allContent, updateContent, currentEditLanguage, isLoading } = useContent();
  const content = allContent[currentEditLanguage];
  const [saveError, setSaveError] = useState("");

  const handleSave = useCallback(
    async (data: ContentData) => {
      setSaveError("");
      let saveErrorMessage = "";
      const saved = await runSave(
        ["아티스트 정보", "소개 섹션"],
        [
          apiUpdateArtistInfo(currentEditLanguage, data.artistInfo),
          apiUpdateAboutSections(currentEditLanguage, data.aboutSections),
        ],
        () => {
          updateContent(data);
        },
        (failedAreas) => {
          saveErrorMessage = `${failedAreas.join(", ")} 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.`;
          setSaveError(saveErrorMessage);
        },
      );
      if (!saved) throw new Error(saveErrorMessage);
    },
    [currentEditLanguage, updateContent],
  );

  const { formData, updateField, saveForm, isSaving, showSuccess } =
    useAdminForm(content, handleSave);

  const [newSectionType, setNewSectionType] = useState<DynamicSectionType>("paragraphs");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  // ──────────────────────────────────────────
  // Artist Info 관리
  // ──────────────────────────────────────────
  const artistInfoItems: ArtistInfoItem[] = formData.artistInfo ?? [];

  const updateArtistInfoItem = (
    id: string,
    field: "key" | "value",
    value: string,
  ) => {
    const updated = artistInfoItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );
    updateField("artistInfo", updated);
  };

  const addArtistInfoItem = () => {
    updateField("artistInfo", [
      ...artistInfoItems,
      { id: crypto.randomUUID(), key: "", value: "" },
    ]);
  };

  const removeArtistInfoItem = (id: string) => {
    if (artistInfoItems.length <= 1) return;
    updateField(
      "artistInfo",
      artistInfoItems.filter((item) => item.id !== id),
    );
  };

  // ──────────────────────────────────────────
  // 동적 섹션 관리
  // ──────────────────────────────────────────
  const sections: DynamicSection[] = [...(formData.aboutSections ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const addSection = (type: DynamicSectionType) => {
    const newSection: DynamicSection = {
      id: crypto.randomUUID(),
      title: "",
      type,
      order: Math.max(-1, ...sections.map((section) => section.order)) + 1,
      paragraphs: type === "paragraphs" ? [""] : undefined,
      items:
        type === "philosophy-items"
          ? [{ id: crypto.randomUUID(), quote: "", description: "" }]
          : undefined,
    };
    updateField("aboutSections", [
      ...(formData.aboutSections ?? []),
      newSection,
    ]);
    setExpandedId(newSection.id);
  };

  const removeSection = (id: string) => {
    if (sections.length <= 1) return;
    const filtered = sections
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }));
    updateField("aboutSections", filtered);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;

    if (pendingDelete.kind === "artist") {
      removeArtistInfoItem(pendingDelete.id);
    } else {
      removeSection(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  const updateSectionTitle = (id: string, title: string) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) =>
        s.id === id ? { ...s, title } : s,
      ),
    );
  };

  const updateSectionType = (id: string, type: DynamicSectionType) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) =>
        s.id === id && s.type !== type
          ? {
              ...s,
              type,
              paragraphs: type === "paragraphs"
                ? (s.items ?? []).flatMap((item) => [item.quote, item.description].filter(Boolean))
                : undefined,
              items: type === "philosophy-items"
                ? (s.paragraphs ?? []).map((description) => ({ id: crypto.randomUUID(), quote: "", description }))
                : undefined,
            }
          : s,
      ),
    );
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updateField(
      "aboutSections",
      updated.map((s, i) => ({ ...s, order: i })),
    );
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updateField(
      "aboutSections",
      updated.map((s, i) => ({ ...s, order: i })),
    );
  };

  // 단락(paragraphs) 관리
  const updateParagraph = (sectionId: string, idx: number, value: string) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) => {
        if (s.id !== sectionId) return s;
        const updated = [...(s.paragraphs ?? [])];
        updated[idx] = value;
        return { ...s, paragraphs: updated };
      }),
    );
  };

  const addParagraph = (sectionId: string) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) =>
        s.id === sectionId
          ? { ...s, paragraphs: [...(s.paragraphs ?? []), ""] }
          : s,
      ),
    );
  };

  const removeParagraph = (sectionId: string, idx: number) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) => {
        if (s.id !== sectionId) return s;
        if ((s.paragraphs ?? []).length <= 1) return s;
        return {
          ...s,
          paragraphs: (s.paragraphs ?? []).filter((_, i) => i !== idx),
        };
      }),
    );
  };

  // philosophy-items 관리
  const updatePhilosophyItem = (
    sectionId: string,
    itemId: string,
    field: "quote" | "description",
    value: string,
  ) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: (s.items ?? []).map((item: PhilosophyItem) =>
            item.id === itemId ? { ...item, [field]: value } : item,
          ),
        };
      }),
    );
  };

  const addPhilosophyItem = (sectionId: string) => {
    const newItem: PhilosophyItem = {
      id: crypto.randomUUID(),
      quote: "",
      description: "",
    };
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) =>
        s.id === sectionId ? { ...s, items: [...(s.items ?? []), newItem] } : s,
      ),
    );
  };

  const removePhilosophyItem = (sectionId: string, itemId: string) => {
    updateField(
      "aboutSections",
      (formData.aboutSections ?? []).map((s) => {
        if (s.id !== sectionId) return s;
        if ((s.items ?? []).length <= 1) return s;
        return {
          ...s,
          items: (s.items ?? []).filter(
            (item: PhilosophyItem) => item.id !== itemId,
          ),
        };
      }),
    );
  };

  return <div className="space-y-8">
    <AdminSectionHeader title="소개" description="아티스트 정보와 소개 글의 내용, 순서, 형식을 관리합니다."
      onSave={saveForm} isSaving={isSaving} isSaveDisabled={isLoading} />
    <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
    <SaveErrorMessage message={saveError} />
    <fieldset disabled={isSaving || isLoading} className="space-y-8">
      <section aria-labelledby="artist-info-title">
        <div className={collection.sectionHeader}>
          <h2 id="artist-info-title">아티스트 정보</h2>
          <button type="button" className={collection.button} onClick={addArtistInfoItem}>정보 추가</button>
        </div>
        <div className={collection.list}>
          {artistInfoItems.map((item, index) => <AdminCard key={item.id}>
            <div className={collection.pairRow}>
              <FormInput label={`정보 ${index + 1} 이름`} value={item.key} onChange={(value) => updateArtistInfoItem(item.id, "key", value)} placeholder="이름, 활동 지역, 장르" />
              <FormInput label={`정보 ${index + 1} 내용`} value={item.value} onChange={(value) => updateArtistInfoItem(item.id, "value", value)} />
              <div className={collection.pairActions}>
                {artistInfoItems.length > 1 && <button type="button" className={collection.dangerButton} aria-label={`${item.key || `정보 ${index + 1}`} 삭제`}
                  onClick={() => setPendingDelete({ kind: "artist", id: item.id, name: item.key || "아티스트 정보" })}>삭제</button>}
              </div>
            </div>
          </AdminCard>)}
          {!artistInfoItems.length && <p className={collection.empty}>이름, 활동 지역 등 아티스트 정보를 추가하세요.</p>}
        </div>
      </section>
      <section aria-labelledby="about-sections-title">
        <div className={collection.sectionHeader}>
          <h2 id="about-sections-title">소개 섹션</h2>
          <div className="flex flex-wrap items-end gap-3">
            <FormSelect label="새 섹션 형식" value={newSectionType} onChange={(value) => setNewSectionType(value as DynamicSectionType)}>
              <option value="paragraphs">문단</option><option value="philosophy-items">인용과 설명</option>
            </FormSelect>
            <button type="button" className={collection.button} onClick={() => addSection(newSectionType)}>섹션 추가</button>
          </div>
        </div>
        <div className={collection.list}>
          {sections.map((section, index) => <AdminEditorItem key={section.id} title={section.title || '제목 없는 섹션'}
            summary={section.type === 'paragraphs' ? `문단 ${(section.paragraphs ?? []).length}개` : `인용과 설명 ${(section.items ?? []).length}개`}
            position={index + 1} expanded={expandedId === section.id} onToggle={() => setExpandedId(expandedId === section.id ? null : section.id)}
            onMoveUp={index > 0 ? () => moveSectionUp(index) : undefined}
            onMoveDown={index < sections.length - 1 ? () => moveSectionDown(index) : undefined}
            onDelete={sections.length > 1 ? () => setPendingDelete({ kind: "section", id: section.id, name: section.title || "소개 섹션" }) : undefined}>
            <div className={collection.stack}>
              <div className={collection.fields}>
                <FormInput label="섹션 제목" value={section.title} onChange={(value) => updateSectionTitle(section.id, value)} />
                <FormSelect label="섹션 형식" value={section.type} onChange={(value) => updateSectionType(section.id, value as DynamicSectionType)}>
                  <option value="paragraphs">문단</option><option value="philosophy-items">인용과 설명</option>
                </FormSelect>
              </div>
              {section.type === 'paragraphs' && <div className={collection.stack}>
                {(section.paragraphs ?? []).map((paragraph, paragraphIndex) => <div key={paragraphIndex} className={collection.inlineItem}>
                  <FormTextarea label={`문단 ${paragraphIndex + 1}`} value={paragraph} onChange={(value) => updateParagraph(section.id, paragraphIndex, value)} rows={5} />
                  {(section.paragraphs ?? []).length > 1 && <button type="button" className={collection.dangerButton} aria-label={`문단 ${paragraphIndex + 1} 삭제`} onClick={() => removeParagraph(section.id, paragraphIndex)}>삭제</button>}
                </div>)}
                <button type="button" className={collection.button} onClick={() => addParagraph(section.id)}>문단 추가</button>
              </div>}
              {section.type === 'philosophy-items' && <div className={collection.stack}>
                {(section.items ?? []).map((item, itemIndex) => <div key={item.id} className={collection.stack}>
                  <FormTextarea label={`인용 ${itemIndex + 1}`} value={item.quote} onChange={(value) => updatePhilosophyItem(section.id, item.id, 'quote', value)} rows={2} />
                  <FormTextarea label={`설명 ${itemIndex + 1}`} value={item.description} onChange={(value) => updatePhilosophyItem(section.id, item.id, 'description', value)} rows={4} />
                  {(section.items ?? []).length > 1 && <button type="button" className={collection.dangerButton} aria-label={`인용과 설명 ${itemIndex + 1} 삭제`} onClick={() => removePhilosophyItem(section.id, item.id)}>이 항목 삭제</button>}
                </div>)}
                <button type="button" className={collection.button} onClick={() => addPhilosophyItem(section.id)}>인용과 설명 추가</button>
              </div>}
            </div>
          </AdminEditorItem>)}
          {!sections.length && <p className={collection.empty}>소개 섹션을 추가해 글을 작성하세요.</p>}
        </div>
      </section>
      {pendingDelete && <DeleteConfirmModal show itemName={pendingDelete.name} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />}
    </fieldset>
  </div>;
};

export default AdminAboutPage;
