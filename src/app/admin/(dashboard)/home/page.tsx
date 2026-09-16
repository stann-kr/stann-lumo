'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormTextarea from '@/components/base/FormTextarea';
import FormSelect from '@/components/base/FormSelect';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import collection from '@/capabilities/admin/AdminCollection.module.css';
import AdminEditorItem from '@/capabilities/admin/AdminEditorItem';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useUnsavedChanges } from '@/capabilities/admin/useUnsavedChanges';
import { runSave } from '@/capabilities/admin/saveResult';
import {
  updateHomeSections as apiUpdateHomeSections,
  updatePageMeta as apiUpdatePageMeta,
  updateArtistInfo as apiUpdateArtistInfo,
} from '@/capabilities/content/contentAdmin.client';
import { fetchTerminalConfig, updateTerminalConfig } from '@/capabilities/terminal/terminalConfig.client';
import type {
  HomeSection, PageMeta, ArtistInfoItem,
} from '@/capabilities/content/content';
import type {
  TerminalInfo,
  TerminalCustomField, TerminalStyleConfig,
} from '@/capabilities/terminal/terminalConfig';

const AdminHomePage = () => {
  const { allContent, updateContent, currentEditLanguage, isLoading } = useContent();
  const content = allContent[currentEditLanguage];

  const [homeSections, setHomeSections] = useState<HomeSection[]>(content.homeSections);
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo>(content.terminalInfo);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [artistInfo, setArtistInfo] = useState<ArtistInfoItem[]>(content.artistInfo);
  const [terminalCustomFields, setTerminalCustomFields] = useState<TerminalCustomField[]>([]);
  const [terminalStyle, setTerminalStyle] = useState<TerminalStyleConfig>({
    fontSize: 'md',
    animationSpeed: 'normal',
    promptText: '>',
    showEmbed: false,
    embedHeight: '400px',
  });
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [expandedCustomField, setExpandedCustomField] = useState<string | null>(null);
  const [terminalLoadAttempt, setTerminalLoadAttempt] = useState(0);
  const [terminalConfigVersion, setTerminalConfigVersion] = useState(0);
  const [isTerminalLoading, setIsTerminalLoading] = useState(true);
  const [terminalLoadError, setTerminalLoadError] = useState('');
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [customFieldDeleteIndex, setCustomFieldDeleteIndex] = useState<number | null>(null);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    setHomeSections(allContent[currentEditLanguage].homeSections);
    setTerminalInfo(allContent[currentEditLanguage].terminalInfo);
    setPageMeta(allContent[currentEditLanguage].pageMeta);
    setArtistInfo(allContent[currentEditLanguage].artistInfo);
  }, [currentEditLanguage, allContent]);

  useEffect(() => {
    let cancelled = false;
    void fetchTerminalConfig()
      .then((res) => {
        if (cancelled) return;
        if (!res.success || !res.data) throw new Error('terminal config');
        if (res.success && res.data) {
          setTerminalCustomFields(res.data.customFields ?? []);
          if (res.data.style) setTerminalStyle(res.data.style);
        }
      })
      .catch(() => { if (!cancelled) setTerminalLoadError('Terminal 설정을 불러오지 못했습니다. 다시 불러와 주세요.'); })
      .finally(() => { if (!cancelled) { setTerminalConfigVersion((version) => version + 1); setIsTerminalLoading(false); } });
    return () => { cancelled = true; };
  }, [terminalLoadAttempt]);

  useEffect(() => { setExpandedSection(null); setExpandedCustomField(null); }, [currentEditLanguage]);

  const { markSaved } = useUnsavedChanges(
    { artistInfo, homeSections, pageMeta, terminalCustomFields, terminalInfo, terminalStyle },
    `${currentEditLanguage}:${isLoading}:${terminalConfigVersion}`,
  );

  const updateSectionField = (index: number, field: keyof HomeSection, value: string) => {
    setHomeSections(prev =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSection = () => {
    setExpandedSection(homeSections.length);
    setHomeSections(prev => [
      ...prev,
      {
        title: '',
        description: '',
        path: '',
        icon: 'ri-star-line',
      },
    ]);
  };

  const deleteSection = (index: number) => {
    setHomeSections(prev => prev.filter((_, i) => i !== index));
    setExpandedSection(null);
    setShowDeleteModal(null);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= homeSections.length) return;
    const updated = [...homeSections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setHomeSections(updated);
    setExpandedSection((selected) => selected === index ? newIndex : selected === newIndex ? index : selected);
  };

  // ─── 터미널 커스텀 필드 핸들러 ─────────────────────────────────
  const addCustomField = () => {
    const id = crypto.randomUUID();
    setExpandedCustomField(id);
    setTerminalCustomFields((prev) => [
      ...prev,
      { id, fieldKey: '', fieldValue: '', fieldType: 'text', sortOrder: prev.length },
    ]);
  };

  const updateCustomField = (index: number, updates: Partial<TerminalCustomField>) => {
    setTerminalCustomFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeCustomField = (index: number) => {
    setTerminalCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCustomField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= terminalCustomFields.length) return;
    const updated = [...terminalCustomFields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setTerminalCustomFields(updated);
  };
  // ─────────────────────────────────────────────────────────────

  const updatePageMetaField = (field: keyof PageMeta['home'], value: string) => {
    setPageMeta(prev => ({ ...prev, home: { ...prev.home, [field]: value } }));
  };

  const getArtistName = () => {
    const nameKey = currentEditLanguage === 'ko' ? '이름' : 'Name';
    return artistInfo.find((i) => i.key === nameKey || i.key === 'Name' || i.key === '이름')?.value ?? '';
  };

  const setArtistName = (value: string) => {
    const nameKey = currentEditLanguage === 'ko' ? '이름' : 'Name';
    setArtistInfo((prev) => {
      const exists = prev.some((item) => item.key === 'Name' || item.key === '이름');
      if (exists) {
        return prev.map((item) =>
          item.key === 'Name' || item.key === '이름'
            ? { ...item, key: nameKey, value }
            : item,
        );
      }
      return [...prev, { id: crypto.randomUUID(), key: nameKey, value }];
    });
  };

  const saveChanges = async () => {
    if (isSaving || isLoading || isTerminalLoading || terminalLoadError) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await runSave(
        ['홈 탐색 항목', '홈 문구', 'Terminal 정보', '아티스트 정보'],
        [
          apiUpdateHomeSections(currentEditLanguage, homeSections),
          apiUpdatePageMeta(currentEditLanguage, pageMeta),
          updateTerminalConfig({
            url: terminalInfo.url,
            description: terminalInfo.description,
            customFields: terminalCustomFields,
            style: terminalStyle,
          }),
          apiUpdateArtistInfo(currentEditLanguage, artistInfo),
        ],
        () => {
          updateContent({
            homeSections,
            terminalInfo: { ...terminalInfo, customFields: terminalCustomFields, style: terminalStyle },
            pageMeta,
            artistInfo,
          });
          markSaved();
          showNotification();
        },
        (failedAreas) => {
          setSaveError(`${failedAreas.join(', ')} 저장에 실패했습니다. 입력한 내용은 유지됩니다. 다시 저장해 주세요.`);
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
        <AdminSectionHeader
          title="홈"
          description="홈 메뉴의 순서와 소개 문구를 관리합니다."
          onSave={saveChanges}
          isSaving={isSaving}
          isSaveDisabled={isLoading || isTerminalLoading || Boolean(terminalLoadError)}
          action={
            <button
              onClick={addSection}
              disabled={isSaving || isLoading || isTerminalLoading || Boolean(terminalLoadError)}
              type="button"
              className={collection.button}
            >
              항목 추가
            </button>
          }
        />

      <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
      <SaveErrorMessage message={saveError || terminalLoadError} />
      {terminalLoadError && <button type="button" className={collection.button} onClick={() => {
        setTerminalLoadError(''); setIsTerminalLoading(true); setTerminalLoadAttempt((attempt) => attempt + 1);
      }}>Terminal 설정 다시 불러오기</button>}
      <fieldset disabled={isSaving || isLoading || isTerminalLoading || Boolean(terminalLoadError)} className="space-y-8">
      {customFieldDeleteIndex !== null && (
        <DeleteConfirmModal
          show={true}
          itemName={terminalCustomFields[customFieldDeleteIndex]?.fieldKey || '추가 정보'}
          onConfirm={() => {
            removeCustomField(customFieldDeleteIndex);
            setCustomFieldDeleteIndex(null);
          }}
          onCancel={() => setCustomFieldDeleteIndex(null)}
        />
      )}

        {/* ARTIST INFO */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            아티스트
          </h2>
          <AdminCard>
            <div className="space-y-2">
              <FormInput
                label="아티스트 이름"
                value={getArtistName()}
                onChange={setArtistName}
                placeholder="ARTIST NAME"
              />
              <p className="text-xs text-[var(--color-secondary)]">
                홈 제목과 소개 페이지에 함께 표시됩니다.
              </p>
            </div>
          </AdminCard>
        </div>

        {/* PAGE SETTINGS */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            홈 소개 문구
          </h2>
          <AdminCard>
            <div className="space-y-4">
              <FormInput
                label="제목 아래 문구"
                value={pageMeta.home.navTitle}
                onChange={(value) => updatePageMetaField('navTitle', value)}
                placeholder="NAVIGATION"
              />
            </div>
          </AdminCard>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">
            홈 탐색 항목
          </h2>
          <p className="mb-4 text-sm text-[var(--color-secondary)]">저장한 순서대로 앞 4개 항목은 홈의 큰 패널에, 이후 항목은 패널 아래 보조 링크에 표시됩니다. 음악·공연·아카이브·소개 패널의 미리보기는 해당 콘텐츠에서 가져옵니다.</p>
          <div className="space-y-4">
            {homeSections.map((section, index) => <AdminEditorItem key={index} title={section.title || '제목 없는 홈 항목'}
              summary={`${index < 4 ? `홈 패널 ${index + 1}` : `보조 링크 ${index - 3}`} · ${section.path || '경로 미입력'}`}
              position={index + 1} expanded={expandedSection === index}
              onToggle={() => setExpandedSection(expandedSection === index ? null : index)}
              onMoveUp={index > 0 ? () => moveSection(index, 'up') : undefined}
              onMoveDown={index < homeSections.length - 1 ? () => moveSection(index, 'down') : undefined}
              onDelete={() => setShowDeleteModal(index)}>
              <div className={collection.stack}>
                <div className={collection.fields}>
                  <FormInput label="메뉴 제목" value={section.title} onChange={(value) => updateSectionField(index, 'title', value)} />
                  <FormInput label="연결 경로" value={section.path} onChange={(value) => updateSectionField(index, 'path', value)} placeholder="/music" />
                </div>
                <FormInput label="메뉴 설명" value={section.description} onChange={(value) => updateSectionField(index, 'description', value)} />
              </div>
            </AdminEditorItem>)}
            {!homeSections.length && <p className={collection.empty}>항목 추가로 홈에 표시할 메뉴를 등록하세요.</p>}
            {showDeleteModal !== null && <DeleteConfirmModal show itemName={homeSections[showDeleteModal]?.title || '홈 항목'}
              onConfirm={() => deleteSection(showDeleteModal)} onCancel={() => setShowDeleteModal(null)} />}
          </div>
        </div>
        {/* Terminal Info */}
        <details className={collection.disclosure}>
          <summary>Terminal 연결 · 추가 정보</summary>

          {/* 기본 정보 */}
          <AdminCard>
            <div className="space-y-4">
              <FormInput
                label="Terminal 주소"
                type="url"
                value={terminalInfo.url}
                onChange={(value) => setTerminalInfo(prev => ({ ...prev, url: value }))}
                placeholder="https://example.com"
              />
              <FormTextarea
                label="Terminal 설명"
                value={terminalInfo.description}
                onChange={(value) => setTerminalInfo(prev => ({ ...prev, description: value }))}
                rows={3}
              />
            </div>
          </AdminCard>

          {/* 스타일 옵션 */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[var(--color-secondary)]/70 tracking-widest mb-3">
              임베드
            </h3>
            <AdminCard>
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={terminalStyle.showEmbed}
                      onChange={(e) => setTerminalStyle((prev) => ({ ...prev, showEmbed: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                    />
                    <span className="text-xs text-[var(--color-secondary)] tracking-widest">홈에서 Terminal 화면 표시</span>
                  </label>
                  {terminalStyle.showEmbed && (
                    <FormInput
                      label="임베드 높이"
                      value={terminalStyle.embedHeight}
                      onChange={(v) => setTerminalStyle((prev) => ({ ...prev, embedHeight: v }))}
                      placeholder="400px"
                    />
                  )}
                </div>

                {/* 임베드 미리보기 토글 */}
                {terminalInfo.url && (
                  <div className="pt-2 border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-secondary) 15%, transparent)' }}>
                    <button
                      type="button"
                      onClick={() => setShowEmbedPreview((prev) => !prev)}
                      aria-expanded={showEmbedPreview}
                      className="text-xs tracking-widest text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <i className={`${showEmbedPreview ? 'ri-eye-off-line' : 'ri-eye-line'}`}></i>
                      {showEmbedPreview ? '미리보기 닫기' : '미리보기 열기'}
                    </button>
                    {showEmbedPreview && (
                      <div className="mt-3 border" style={{ borderColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}>
                        <iframe
                          src={terminalInfo.url}
                          style={{ width: '100%', height: terminalStyle.embedHeight, border: 'none' }}
                          title="Terminal Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AdminCard>
          </div>

          {/* 커스텀 필드 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-secondary)]/70 tracking-widest">
                추가 정보
              </h3>
              <button
                onClick={addCustomField}
                className="text-xs tracking-widest text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-add-line"></i>정보 추가
              </button>
            </div>

            {terminalCustomFields.length === 0 ? (
              <AdminCard>
                <p className="text-xs text-[var(--color-secondary)] text-center py-2">
                  등록한 추가 정보가 없습니다.
                </p>
              </AdminCard>
            ) : (
              <div className="space-y-3">
                {terminalCustomFields.map((field, index) => <AdminEditorItem key={field.id} title={field.fieldKey || '이름 없는 추가 정보'}
                  summary={field.fieldValue} position={index + 1} expanded={expandedCustomField === field.id}
                  onToggle={() => setExpandedCustomField(expandedCustomField === field.id ? null : field.id)}
                  onMoveUp={index > 0 ? () => moveCustomField(index, 'up') : undefined}
                  onMoveDown={index < terminalCustomFields.length - 1 ? () => moveCustomField(index, 'down') : undefined}
                  onDelete={() => setCustomFieldDeleteIndex(index)}>
                  <div className={collection.stack}>
                    <div className={collection.fields}>
                      <FormInput label="항목 이름" value={field.fieldKey} onChange={(fieldKey) => updateCustomField(index, { fieldKey })} />
                      <FormSelect label="표시 방식" value={field.fieldType} onChange={(value) => updateCustomField(index, { fieldType: value as TerminalCustomField['fieldType'] })}>
                        <option value="text">텍스트</option><option value="url">링크</option><option value="badge">배지</option>
                      </FormSelect>
                    </div>
                    <FormInput label="내용" value={field.fieldValue} onChange={(fieldValue) => updateCustomField(index, { fieldValue })} />
                  </div>
                </AdminEditorItem>)}
              </div>
            )}
          </div>
        </details>

      </fieldset>
    </div>
  );
};

export default AdminHomePage;
