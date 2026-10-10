'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useContent } from '@/contexts/ContentContext';
import styles from './AdminContentGate.module.css';

interface AdminContentGateProps {
  children: ReactNode;
}

export default function AdminContentGate({ children }: AdminContentGateProps) {
  const { contentStatus, retryContent } = useContent();
  const statusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (contentStatus === 'error') statusRef.current?.focus();
  }, [contentStatus]);

  const handleRetry = () => {
    statusRef.current?.focus();
    retryContent();
  };

  if (contentStatus === 'ready') {
    return (
      <>
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          콘텐츠를 불러왔습니다. 편집할 수 있습니다.
        </p>
        {children}
      </>
    );
  }

  if (contentStatus === 'error') {
    return (
      <section
        ref={statusRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        tabIndex={-1}
        className={styles.state}
      >
        <h2>콘텐츠를 불러오지 못했습니다.</h2>
        <p>한국어·영어 콘텐츠를 모두 불러와야 편집할 수 있습니다. 잠시 후 다시 시도해 주세요.</p>
        <button type="button" onClick={handleRetry}>다시 불러오기</button>
      </section>
    );
  }

  return (
    <section
      ref={statusRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      tabIndex={-1}
      className={styles.state}
    >
      <p>콘텐츠를 불러오는 중…</p>
    </section>
  );
}
