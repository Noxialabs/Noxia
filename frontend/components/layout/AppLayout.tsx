"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PublicLayout from './PublicLayout';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from './LoadingSpinner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen transition-all duration-300 pa-4">
      {isAuthenticated ? (
        <DashboardLayout user={user}>
          {children}
        </DashboardLayout>
      ) : (
        <PublicLayout>
          {children}
        </PublicLayout>
      )}
    </div>
  );
}