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
}

export default function PageLayout({ title, titleExtra, subtitle, children, motionRevision, titleSize = 'label', animateEntry = true, eyebrow }: PageLayoutProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  useContentMotion(pageRef, `${title}:${motionRevision ?? ''}`, animateEntry);
  return (
    <div ref={pageRef} className={styles.page}>
      <header className={styles.header} data-size={titleSize}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1>{title}{titleExtra?.map((line, index) => <span key={index}>{line}</span>)}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
