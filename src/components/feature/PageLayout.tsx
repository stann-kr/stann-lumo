'use client';

import { useRef, type ReactNode } from 'react';
import { useContentMotion } from './useContentMotion';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  title: string;
  titleExtra?: string[];
  subtitle?: string;
  children: ReactNode;
  motionRevision?: string | number;
  titleSize?: 'label' | 'display';
  animateEntry?: boolean;
  /** Context navigation rendered above the title, e.g. the parent list. */
  eyebrow?: ReactNode;
  /** Readouts beside the title plate, e.g. item counts. */
  meta?: ReactNode;
}

/** v5 inner page: a title plate followed by the page's own plates, separated by the field gap. */
export default function PageLayout({ title, titleExtra, subtitle, children, motionRevision, titleSize = 'label', animateEntry = true, eyebrow, meta }: PageLayoutProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  useContentMotion(pageRef, `${title}:${motionRevision ?? ''}`, animateEntry);
  return (
    <div ref={pageRef} className={styles.page}>
      <header className={styles.header} data-size={titleSize} data-meta={Boolean(meta)}>
        <div className={styles.titleBlock}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <h1>{title}{titleExtra?.map((line, index) => <span key={index}>{line}</span>)}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {meta && <div className={styles.meta}>{meta}</div>}
      </header>
      {children}
    </div>
  );
}
