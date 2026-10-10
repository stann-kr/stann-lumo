'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminReturnPath, authenticateAdmin, getAdminSessionState } from '@/capabilities/auth/auth.client';
import FormInput from '@/components/base/FormInput';
import styles from './page.module.css';

/** Read at use time so the statically rendered login page needs no search-param Suspense boundary. */
function returnPath() {
  return adminReturnPath(new URLSearchParams(window.location.search).get('next'));
}

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // An editor that is still signed in (for example a second tab) goes straight back to work.
  useEffect(() => {
    let active = true;
    void getAdminSessionState().then((session) => {
      if (active && session === 'authenticated') router.replace(returnPath());
    });
    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await authenticateAdmin(password);
      if (result.isAuthenticated) router.replace(returnPath());
      else { setError(result.errorMessage ?? '비밀번호를 확인해 주세요.'); setPassword(''); }
    } catch { setError('연결하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setLoading(false); }
  };

  return <main className={styles.login}>
    <section className={styles.panel} aria-labelledby="admin-login-title">
      <p className={styles.brand}>STANN LUMO</p>
      <h1 id="admin-login-title">콘텐츠 관리</h1>
      <form onSubmit={handleSubmit}>
        <FormInput id="password" label="관리자 비밀번호" type="password" value={password}
          onChange={(value) => { setPassword(value); setError(''); }} required autoComplete="current-password"
          aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} disabled={loading} />
        {error && <p id="login-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading} aria-busy={loading}>{loading ? '로그인 중…' : '로그인'}</button>
      </form>
      <Link href="/">사이트로 돌아가기</Link>
    </section>
  </main>;
}
