'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import FormTextarea from '@/components/base/FormTextarea';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useUnsavedChanges } from '@/capabilities/admin/useUnsavedChanges';
import AdminEditorItem from '@/capabilities/admin/AdminEditorItem';
import collection from '@/capabilities/admin/AdminCollection.module.css';
import { runSave } from '@/capabilities/admin/saveResult';

import {
  updateLinkPlatforms as apiUpdateLinkPlatforms,
  updatePageMeta as apiUpdatePageMeta,
} from '@/capabilities/content/contentAdmin.client';
import { updateTerminalInfo as apiUpdateTerminalInfo } from '@/capabilities/site/siteConfig.client';
import type { PageMeta } from '@/capabilities/content/content';

const AdminLinkPage = () => {
  const { allContent, updateContent, currentEditLanguage, isLoading } = useContent();
  const content = allContent[currentEditLanguage];
  const [linkPlatforms, setLinkPlatforms] = useState(content.linkPlatforms);
  const [terminalInfo, setTerminalInfo] = useState(content.terminalInfo);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    setLinkPlatforms(allContent[currentEditLanguage].linkPlatforms);
    setTerminalInfo(allContent[currentEditLanguage].terminalInfo);
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  useEffect(() => { setExpandedId(null); setShowDeleteModal(null); }, [currentEditLanguage]);

  const { markSaved } = useUnsavedChanges(
    { linkPlatforms, pageMeta, terminalInfo },
    `${currentEditLanguage}:${isLoading}`,
  );

  const addNewPlatform = () => {
    const id = crypto.randomUUID();
    setExpandedId(id);
    setLinkPlatforms([
      ...linkPlatforms,
      {
        id,
        platform: '',
        url: '',
        icon: 'ri-link-line',
        description: '',
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
    if (isSaving || isLoading) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await runSave(
        ['링크 목록', '페이지 문구', 'Terminal 정보'],
        [
          apiUpdateLinkPlatforms(currentEditLanguage, linkPlatforms),
          apiUpdatePageMeta(currentEditLanguage, pageMeta),
          apiUpdateTerminalInfo(terminalInfo),
        ],
        () => {
          updateContent({ linkPlatforms, terminalInfo, pageMeta });
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

  return <div className="space-y-8">
    <AdminSectionHeader title="링크" description="외부 사이트와 소셜 링크의 내용과 순서를 관리합니다."
      onSave={saveChanges} isSaving={isSaving} isSaveDisabled={isLoading}
      action={<button type="button" className={collection.button} disabled={isSaving || isLoading} onClick={addNewPlatform}>링크 추가</button>} />
    <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
    <SaveErrorMessage message={saveError} />
    <fieldset disabled={isSaving || isLoading} className="space-y-8">
      <section aria-label="외부 링크 목록" className={collection.list}>
        {linkPlatforms.map((platform, index) => <AdminEditorItem key={platform.id} title={platform.platform || '이름 없는 링크'}
          summary={platform.url || '연결 주소를 입력하세요'} position={index + 1} expanded={expandedId === platform.id}
          onToggle={() => setExpandedId(expandedId === platform.id ? null : platform.id)}
          onMoveUp={index > 0 ? () => movePlatform(index, 'up') : undefined}
          onMoveDown={index < linkPlatforms.length - 1 ? () => movePlatform(index, 'down') : undefined}
          onDelete={() => setShowDeleteModal(platform.id)}>
          <div className={collection.stack}>
            <div className={collection.fields}>
              <FormInput label="링크 이름" value={platform.platform} onChange={(value) => updatePlatformField(platform.id, 'platform', value)} placeholder="SoundCloud" />
              <FormInput label="연결 주소" type="url" value={platform.url} onChange={(value) => updatePlatformField(platform.id, 'url', value)} placeholder="https://" />
            </div>
            <FormInput label="링크 설명" value={platform.description} onChange={(value) => updatePlatformField(platform.id, 'description', value)} />
          </div>
        </AdminEditorItem>)}
        {!linkPlatforms.length && <p className={collection.empty}>아직 등록한 링크가 없습니다. 링크 추가로 시작하세요.</p>}
      </section>
      <details className={collection.disclosure}><summary>Terminal 연결</summary>
        <AdminCard><div className={collection.stack}>
          <p className={collection.notice}>연결 주소와 설명은 홈에도 함께 적용됩니다.</p>
          <FormInput label="Terminal 제목" value={pageMeta.link.terminalTitle} onChange={(value) => updatePageMetaField('terminalTitle', value)} />
          <FormInput label="Terminal 주소" type="url" value={terminalInfo.url} onChange={(url) => setTerminalInfo({ ...terminalInfo, url })} />
          <FormTextarea label="Terminal 설명" value={terminalInfo.description} onChange={(description) => setTerminalInfo({ ...terminalInfo, description })} rows={3} />
        </div></AdminCard>
      </details>
      <details className={collection.disclosure}><summary>페이지 문구</summary>
        <AdminCard><div className={collection.fields}>
          <FormInput label="페이지 제목" value={pageMeta.link.title} onChange={(value) => updatePageMetaField('title', value)} />
          <FormInput label="페이지 부제" value={pageMeta.link.subtitle} onChange={(value) => updatePageMetaField('subtitle', value)} />
        </div></AdminCard>
      </details>
      {showDeleteModal && <DeleteConfirmModal show itemName={linkPlatforms.find((p) => p.id === showDeleteModal)?.platform || '이름 없는 링크'}
        onConfirm={() => deletePlatform(showDeleteModal)} onCancel={() => setShowDeleteModal(null)} />}
    </fieldset>
  </div>;
};

export default AdminLinkPage;
