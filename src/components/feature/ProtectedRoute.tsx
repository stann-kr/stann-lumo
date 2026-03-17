'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const router = useRouter();
  const isAuthenticated =
    typeof window !== 'undefined' &&
    localStorage.getItem('admin_authenticated') === 'true';

  useEffect(() => {
    if (!isAuthenticated) router.replace('/admin');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return children;
};

export default ProtectedRoute;
