import type { ReactNode } from 'react';
import Link from '../feature/PublicLink';
import v5 from '@/styles/v5.module.css';
import styles from './DetailMore.module.css';

export interface DetailMoreItem { id: string; href: string; title: string; meta: string; media: ReactNode }

/* v5 "more" plate closing a detail page: a band naming the list, then up to four cards (media, title, mono meta) that
   span the page width, so the page ends on something to follow rather than an empty field. */
export default function DetailMore({ id, title, all, items }: { id: string; title: string; all: { href: string; label: string }; items: DetailMoreItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className={v5.plate} aria-labelledby={id}>
      <div className={v5.band}>
        <h2 id={id} className={v5.label}>{title}</h2>
        <Link href={all.href} className={`${v5.label} ${styles.all}`}>{all.label} →</Link>
      </div>
      <ul className={styles.cards}>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className={styles.card}>
              <span className={styles.media}>{item.media}</span>
              <span className={styles.text}>
                <strong className={styles.title}>{item.title}</strong>
                <span className={`${v5.mono} ${styles.meta}`}>{item.meta}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
