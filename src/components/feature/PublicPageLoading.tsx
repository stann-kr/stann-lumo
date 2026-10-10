'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './PublicPageLoading.module.css';
import { usePublicMotionInput } from './publicMotion';

export default function PublicPageLoading({ overlay = false }: { overlay?: boolean }) {
  const { language } = useLanguage();
  const input = usePublicMotionInput();
  return (
    <div className={`${styles.loading} ${overlay ? styles.overlay : ''}`} data-motion={input?.current === 'keyboard' ? 'off' : 'on'} role="status" aria-live="polite" aria-atomic="true">
      <div className={styles.indicator}>
        <span className={styles.label}>{language === 'ko' ? '페이지 불러오는 중' : 'Loading page'}</span>
        <span className={styles.track} aria-hidden="true"><span /></span>
      </div>
    </div>
  );
}
