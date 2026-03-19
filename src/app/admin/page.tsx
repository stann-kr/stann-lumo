'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/admin/home');
      } else {
        const data = await res.json() as { error?: { message?: string } };
        setError(data?.error?.message ?? 'Invalid password');
        setPassword('');
      }
    } catch {
      setError('Connection error. Please try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-secondary)] font-mono flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--color-primary)] tracking-wider mb-2">
            ADMIN ACCESS
          </h1>
          <p className="text-sm text-[var(--color-muted)] tracking-widest">CONTENT MANAGEMENT SYSTEM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm tracking-widest text-[var(--color-secondary)]/70 mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-transparent border-b border-[var(--color-secondary)]/30 py-3 px-1 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] transition-colors duration-200"
              placeholder="Enter admin password"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-secondary)]/70 bg-[var(--color-secondary)]/5 px-4 py-3 border border-[var(--color-secondary)]/20">
              <i className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 text-[var(--color-primary)] py-4 px-6 transition-all duration-200 cursor-pointer border border-[var(--color-secondary)]/30 hover:border-[var(--color-secondary)]/50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm tracking-widest">{loading ? 'VERIFYING...' : 'ENTER ADMIN'}</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm tracking-widest text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            BACK TO SITE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
