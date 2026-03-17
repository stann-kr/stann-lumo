'use client';
import { ReactNode } from 'react';
import ProtectedRoute from '@/components/feature/ProtectedRoute';
import AdminLayout from '@/components/feature/AdminLayout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
