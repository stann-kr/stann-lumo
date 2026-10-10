'use client';

import { useId, type ReactNode } from 'react';
import styles from './AdminEditorItem.module.css';

interface AdminEditorItemProps {
  title: string;
  summary?: string;
  position: number;
  expanded: boolean;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  children: ReactNode;
}

/** Collapsible editor for ordered content. The page owns selection and data. */
export default function AdminEditorItem({ title, summary, position, expanded, onToggle, onMoveUp, onMoveDown, onDelete, children }: AdminEditorItemProps) {
  const panelId = useId();
  return <article className={styles.item}>
    <div className={styles.header}>
      <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={panelId}
        aria-label={`${title} 편집`} onClick={onToggle}>
        <span className={styles.position} aria-hidden="true">{String(position).padStart(2, '0')}</span>
        <span className={styles.identity}><strong>{title}</strong>{summary && <span>{summary}</span>}</span>
        <span className={styles.state}>{expanded ? '접기' : '편집'}</span>
      </button>
      <div className={styles.actions}>
        <button type="button" aria-label={`${title} 위로 이동`} disabled={!onMoveUp} onClick={onMoveUp}>↑</button>
        <button type="button" aria-label={`${title} 아래로 이동`} disabled={!onMoveDown} onClick={onMoveDown}>↓</button>
        {onDelete && <button type="button" className={styles.delete} aria-label={`${title} 삭제`} onClick={onDelete}>삭제</button>}
      </div>
    </div>
    <div id={panelId} hidden={!expanded} className={styles.editor}>{expanded && children}</div>
  </article>;
}
