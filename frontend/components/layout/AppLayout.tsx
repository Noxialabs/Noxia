//layout/AppLayout.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import PublicLayout from "./PublicLayout";
import DashboardLayout from "./DashboardLayout";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Define which routes should use DashboardLayout even when authenticated
  const dashboardRoutes = [
    "/dashboard",
    "/cases",
    "/analytics",
    "/documents",
    "/profile",
    "/settings",
    "/notifications",
  ];

  // Define auth routes that should redirect if authenticated
  const authRoutes = ["/auth/login", "/auth/register"];

  // Check if current path should use dashboard layout
  const shouldUseDashboardLayout = dashboardRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Always call useEffect hooks in the same order
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect logic for auth routes when user is authenticated
  useEffect(() => {
    if (isAuthenticated && isAuthRoute && mounted) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, isAuthRoute, mounted]);

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  // Don't render auth routes if user is authenticated (prevents flash)
  if (isAuthenticated && isAuthRoute) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen transition-all duration-300 pa-4">
      {isAuthenticated && shouldUseDashboardLayout ? (
        <DashboardLayout user={user}>{children}</DashboardLayout>
      ) : (
        <PublicLayout>{children}</PublicLayout>
      )}
    </div>
  );
}
