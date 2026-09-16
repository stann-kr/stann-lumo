'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import ListItemEditor from '@/components/base/ListItemEditor';
import SuccessMessage from '@/components/base/SuccessMessage';
import SaveErrorMessage from '@/components/base/SaveErrorMessage';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useSaveNotification } from '@/capabilities/admin/useSaveNotification';
import { useUnsavedChanges } from '@/capabilities/admin/useUnsavedChanges';
import collection from '@/capabilities/admin/AdminCollection.module.css';
import { runSave } from '@/capabilities/admin/saveResult';
import {
  updateContactInfo as apiUpdateContactInfo,
  updatePageMeta as apiUpdatePageMeta,
} from '@/capabilities/content/contentAdmin.client';
import { updateEventsInfo as apiUpdateEventsInfo } from '@/capabilities/events/eventsAdmin.client';
import type { ContactItem, PageMeta } from '@/capabilities/content/content';
import type { EventsInfo } from '@/capabilities/events/events';

const AdminContactPage = () => {
  const { allContent, updateContent, currentEditLanguage, isLoading } = useContent();
  const content = allContent[currentEditLanguage];
  const [contactInfo, setContactInfo] = useState<ContactItem[]>(content.contactInfo);
  const [eventsInfo, setEventsInfo] = useState<EventsInfo>(content.eventsInfo);
  const [pageMeta, setPageMeta] = useState<PageMeta>(content.pageMeta);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteContactIndex, setDeleteContactIndex] = useState<number | null>(null);
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    setContactInfo(allContent[currentEditLanguage].contactInfo);
    setEventsInfo(allContent[currentEditLanguage].eventsInfo);
    setPageMeta(allContent[currentEditLanguage].pageMeta);
  }, [currentEditLanguage, allContent]);

  const { markSaved } = useUnsavedChanges(
    { contactInfo, eventsInfo, pageMeta },
    `${currentEditLanguage}:${isLoading}`,
  );

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
    if (isSaving || isLoading) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await runSave(
        ['연락처', '부킹 안내', '페이지 문구'],
        [
          apiUpdateContactInfo(currentEditLanguage, contactInfo),
          apiUpdateEventsInfo(currentEditLanguage, eventsInfo),
          apiUpdatePageMeta(currentEditLanguage, pageMeta),
        ],
        () => {
          updateContent({ contactInfo, eventsInfo, pageMeta });
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
    <AdminSectionHeader title="연락처" description="연락 방법과 공연 부킹에 필요한 안내를 관리합니다."
      onSave={saveChanges} isSaving={isSaving} isSaveDisabled={isLoading} />
    <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />
    <SaveErrorMessage message={saveError} />
    <fieldset disabled={isSaving || isLoading} className="space-y-8">
      <section aria-labelledby="contact-methods-title">
        <div className={collection.sectionHeader}>
          <h2 id="contact-methods-title">연락 방법</h2>
          <button type="button" className={collection.button} onClick={addContactItem}>연락처 추가</button>
        </div>
        <div className={collection.list}>
          {contactInfo.map((item, index) => <AdminCard key={index}>
            <div className={collection.fields}>
              <FormInput label={`연락처 ${index + 1} 이름`} value={item.label} onChange={(value) => updateContactItemField(index, 'label', value)} placeholder="부킹 문의" />
              <FormInput label={`연락처 ${index + 1} 내용`} value={item.value} onChange={(value) => updateContactItemField(index, 'value', value)} placeholder="booking@example.com" />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className={collection.button} aria-label={`연락처 ${index + 1} 위로 이동`} disabled={index === 0} onClick={() => moveContactItem(index, 'up')}>위로</button>
              <button type="button" className={collection.button} aria-label={`연락처 ${index + 1} 아래로 이동`} disabled={index === contactInfo.length - 1} onClick={() => moveContactItem(index, 'down')}>아래로</button>
              <button type="button" className={collection.dangerButton} aria-label={`연락처 ${item.label || index + 1} 삭제`} onClick={() => setDeleteContactIndex(index)}>삭제</button>
            </div>
          </AdminCard>)}
          {!contactInfo.length && <p className={collection.empty}>연락처 추가로 이메일이나 연락 방법을 등록하세요.</p>}
        </div>
      </section>
      <section aria-labelledby="booking-title">
        <div className={collection.sectionHeader}><h2 id="booking-title">부킹 안내</h2></div>
        <AdminCard className={collection.stack}>
          <div className={collection.fields}>
            <FormInput label="부킹 이메일" type="email" value={eventsInfo.contactEmail} onChange={(value) => updateEventsInfoField('contactEmail', value)} />
            <FormInput label="응답 시간 안내" value={eventsInfo.responseTime} onChange={(value) => updateEventsInfoField('responseTime', value)} placeholder="48시간 이내 회신" />
          </div>
          <div className={collection.fields}>
            <ListItemEditor label="공연 시간" items={eventsInfo.setDurations}
              onUpdate={(index, value) => updateListItem('setDurations', index, value)}
              onAdd={() => addListItem('setDurations')} onRemove={(index) => removeListItem('setDurations', index)} />
            <ListItemEditor label="기술 요구사항" items={eventsInfo.technicalRequirements}
              onUpdate={(index, value) => updateListItem('technicalRequirements', index, value)}
              onAdd={() => addListItem('technicalRequirements')} onRemove={(index) => removeListItem('technicalRequirements', index)} />
          </div>
        </AdminCard>
      </section>
      <details className={collection.disclosure}><summary>페이지 문구</summary>
        <AdminCard><div className={collection.fields}>
          <FormInput label="페이지 제목" value={pageMeta.contact.title} onChange={(value) => updatePageMetaField('title', value)} />
          <FormInput label="페이지 부제" value={pageMeta.contact.subtitle} onChange={(value) => updatePageMetaField('subtitle', value)} />
          <FormInput label="연락처 영역 이름" value={pageMeta.contact.directTitle} onChange={(value) => updatePageMetaField('directTitle', value)} />
          <FormInput label="부킹 영역 제목" value={pageMeta.contact.bookingTitle} onChange={(value) => updatePageMetaField('bookingTitle', value)} />
        </div></AdminCard>
      </details>
      {deleteContactIndex !== null && <DeleteConfirmModal show itemName={contactInfo[deleteContactIndex]?.label || '연락처'}
        onConfirm={() => { deleteContactItem(deleteContactIndex); setDeleteContactIndex(null); }} onCancel={() => setDeleteContactIndex(null)} />}
    </fieldset>
  </div>;
};

export default AdminContactPage;
