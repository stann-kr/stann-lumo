'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './PublicPageLoading.module.css';
import { usePublicMotionInput } from './publicMotion';

/**
 * Route loading screen. `gate` is the reveal-gate variant: the page is already rendered and only waiting for
 * its first-screen images, so it stays visual-only (no status announcement) and hides itself with the gate failsafe.
 */
export default function PublicPageLoading({ overlay = false, gate = false }: { overlay?: boolean; gate?: boolean }) {
  const { language } = useLanguage();
  const input = usePublicMotionInput();
  const label = language === 'ko' ? '페이지 불러오는 중' : 'Loading page';
  return (
    <div className={`${styles.loading} ${overlay ? styles.overlay : ''} ${gate ? styles.gate : ''}`} data-motion={input?.current === 'keyboard' ? 'off' : 'on'}
      {...(gate ? { 'aria-hidden': true } : { role: 'status', 'aria-live': 'polite' as const, 'aria-atomic': true })}>
      <div className={styles.indicator}>
        <span className={styles.label}>{label}</span>
        <span className={styles.track} aria-hidden="true"><span /></span>
      </div>
    </div>
  );
}
