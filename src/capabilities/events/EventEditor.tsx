'use client';

import { useState } from 'react';
import FormInput from '@/components/base/FormInput';
import FormSelect from '@/components/base/FormSelect';
import LoadingImage from '@/capabilities/media/LoadingImage';
import { getPublicImageUrl } from '@/capabilities/media/media';
import type { Performance } from './events';
import styles from './EventEditor.module.css';

interface EventEditorProps {
  event: Performance;
  isNew: boolean;
  posterBusy: boolean;
  posterError?: string;
  hasEventEdits: boolean;
  onChange: (field: keyof Performance, value: string) => void;
  onPosterChange: (file?: File) => void;
  onDelete: () => void;
}

export default function EventEditor({ event, isNew, posterBusy, posterError, hasEventEdits, onChange, onPosterChange, onDelete }: EventEditorProps) {
  const [expanded, setExpanded] = useState(isNew);
  const panelId = `event-editor-${event.id}`;
  const uploadId = `event-poster-${event.id}`;
  const posterDisabled = posterBusy || hasEventEdits;
  return <article className={styles.event} aria-label={event.title || '새 공연'} aria-busy={posterBusy}>
    <div className={styles.row}>
      <div className={styles.poster}>
        {event.posterImageId ? <LoadingImage src={getPublicImageUrl(event.posterImageId)} alt="" quiet /> : <span>포스터<br />없음</span>}
      </div>
      <button className={styles.summary} type="button" aria-label={`${event.title || '새 공연'} 편집`} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)}>
        <span className={styles.date}>{event.date || '날짜 미정'}{event.time && ` · ${event.time}`}</span>
        <strong>{event.title || '새 공연'}</strong>
        <span>{[event.venue, event.location].filter(Boolean).join(' · ') || '장소 미정'}</span>
      </button>
      <div className={styles.actions}>
        <span className={styles.status}>{event.status === 'Cancelled' ? '취소' : event.status === 'TBA' ? '미정' : '공개'}{event.raEventId ? ' · RA' : ''}</span>
        <label className={styles.upload} htmlFor={uploadId} data-disabled={posterDisabled}>
          {posterBusy ? '처리 중…' : event.posterImageId ? '포스터 교체' : '포스터 업로드'}
          <input id={uploadId} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            aria-label={`${event.title || '새 공연'} 포스터 ${event.posterImageId ? '교체' : '업로드'}`}
            aria-describedby={hasEventEdits ? 'event-poster-draft-help' : undefined}
            disabled={posterDisabled} onChange={(inputEvent) => {
              const file = inputEvent.target.files?.[0];
              if (file) onPosterChange(file);
              inputEvent.target.value = '';
            }} />
        </label>
        <button type="button" className={styles.expand} aria-label={`${expanded ? '편집 닫기' : '상세 편집'} ${event.title}`} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)}>
          {expanded ? '편집 닫기' : '상세 편집'}<span className="sr-only"> {event.title}</span>
        </button>
      </div>
    </div>
    {posterError && <p role="alert" className={styles.feedback}>{posterError}</p>}
    {posterBusy && <p role="status" className={styles.feedback}>포스터를 저장하는 중입니다.</p>}
    {expanded && <div className={styles.editor} id={panelId}>
      <div className={styles.fields}>
        <FormInput label="공연 제목" value={event.title} onChange={(value) => onChange('title', value)} />
        <FormInput label="날짜" type="date" value={event.date.replaceAll('.', '-')} onChange={(value) => onChange('date', value)} />
        <FormInput label="시간" type="time" value={event.time ?? ''} onChange={(value) => onChange('time', value)} />
        <FormInput label="장소" value={event.venue} onChange={(value) => onChange('venue', value)} />
        <FormInput label="지역" value={event.location ?? ''} onChange={(value) => onChange('location', value)} />
        <FormSelect label="공연 상태" value={event.status} onChange={(value) => onChange('status', value)}>
          <option value="Announced">공개</option><option value="TBA">미정</option><option value="Cancelled">취소</option>
        </FormSelect>
      </div>
      <div className={styles.editorFooter}>
        <div>
          {event.raEventId && <a href={`https://ra.co/events/${event.raEventId}`} target="_blank" rel="noreferrer">RA에서 공연 보기</a>}
          <p>포스터는 직접 업로드하며 즉시 반영됩니다. 최대 10MB.</p>
          {isNew && <p>새 공연은 먼저 저장한 뒤 포스터를 올릴 수 있습니다.</p>}
        </div>
        <div className={styles.destructive}>
          {event.posterImageId && <button type="button" disabled={posterDisabled} onClick={() => onPosterChange()}>포스터 제거</button>}
          <button type="button" onClick={onDelete} aria-label={`이벤트 ${event.title} 삭제`}>공연 삭제</button>
        </div>
      </div>
      {event.raEventId && <p className={styles.deleteHint}>공연을 삭제하고 저장하면 이후 RA 동기화에서도 제외됩니다.</p>}
    </div>}
  </article>;
}
