'use client';

import Link from '@/components/feature/PublicLink';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/components/public/PublicFallback.module.css';

export default function PublicRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isKorean = useLanguage().language === 'ko';
  return (
    <section className={styles.fallback} role="alert">
      <h1>{isKorean ? '콘텐츠를 불러올 수 없습니다.' : 'Content unavailable.'}</h1>
      <p>{isKorean ? '잠시 후 다시 시도해 주세요.' : 'This page could not be loaded. Please try again in a moment.'}</p>
      <div className={styles.actions}>
        <button type="button" onClick={reset}>{isKorean ? '다시 시도' : 'Retry'}</button>
        <Link href="/">{isKorean ? '홈으로' : 'Return home'}</Link>
      </div>
    </section>
  );
}
