import Link from 'next/link';
import styles from './PublicFallback.module.css';

export default function PublicNotFound({ isKorean }: { isKorean: boolean }) {
  return (
    <section className={styles.fallback}>
      <p className={styles.code}>404</p>
      <h1>{isKorean ? '페이지를 찾을 수 없습니다.' : 'Page not found.'}</h1>
      <p>{isKorean ? '주소를 확인하거나 홈에서 다시 찾아보세요.' : 'Check the address or explore from the home page.'}</p>
      <div className={styles.actions}><Link href="/">{isKorean ? '홈으로' : 'Return home'}</Link></div>
    </section>
  );
}
