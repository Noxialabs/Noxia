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

  const dashboardOnlyRoutes = [
    "/dashboard",
    "/cases/[id]/edit", // Case editing with ID
    "/cases/[id]/details", // Case editing with ID
    "/cases",
   
  ];

  const publicOnlyRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/",
    "/#about",
    "/#contact",
    "/#privacy",
  ];

  // Routes that can use EITHER layout based on authentication status
  const flexibleRoutes = [
    "/case-submission-form",
  ];

  // Check route types
  const isDashboardOnlyRoute = dashboardOnlyRoutes.some((route) => {
    if (route.includes("[id]")) {
      // Handle dynamic routes like /cases/[id]/edit
      const routePattern = route.replace("[id]", "[^/]+");
      const regex = new RegExp(`^${routePattern.replace(/\//g, "\\/")}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });

  const isPublicOnlyRoute = publicOnlyRoutes.some((route) => {
    if (route.includes("[id]")) {
      const routePattern = route.replace("[id]", "[^/]+");
      const regex = new RegExp(`^${routePattern.replace(/\//g, "\\/")}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });

  const isFlexibleRoute = flexibleRoutes.some((route) => {
    if (route.includes("[id]")) {
      const routePattern = route.replace("[id]", "[^/]+");
      const regex = new RegExp(`^${routePattern.replace(/\//g, "\\/")}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });

  // Determine which layout to use
  const shouldUseDashboardLayout = () => {
    // If user is authenticated
    if (isAuthenticated) {
      // Use dashboard layout for dashboard-only routes and flexible routes
      return isDashboardOnlyRoute || isFlexibleRoute;
    }
    
    // If user is not authenticated
    // Only use dashboard layout for dashboard-only routes (which should redirect anyway)
    return false;
  };

  const shouldUsePublicLayout = () => {
    // If user is not authenticated
    if (!isAuthenticated) {
      // Use public layout for public-only routes and flexible routes
      return isPublicOnlyRoute || isFlexibleRoute;
    }
    
    // If user is authenticated
    // Use public layout only for public-only routes (like home page, about, etc.)
    return isPublicOnlyRoute;
  };

  // Handle special cases
  const isAuthRoute = publicOnlyRoutes.some((route) => 
    route.startsWith("/auth") && pathname.startsWith(route)
  );

  console.log("Route Analysis:", {
    pathname,
    isAuthenticated,
    isDashboardOnlyRoute,
    isPublicOnlyRoute,
    isFlexibleRoute,
    isAuthRoute,
    shouldUseDashboard: shouldUseDashboardLayout(),
    shouldUsePublic: shouldUsePublicLayout()
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect logic for auth routes when user is authenticated
  useEffect(() => {
    if (isAuthenticated && isAuthRoute && mounted) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, isAuthRoute, mounted]);

  // Redirect logic for dashboard-only routes when user is not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading && mounted && isDashboardOnlyRoute) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
    }
  }, [isAuthenticated, loading, mounted, isDashboardOnlyRoute, pathname]);

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  // Don't render auth routes if user is authenticated (prevents flash)
  if (isAuthenticated && isAuthRoute) {
    return <LoadingSpinner />;
  }

  // Don't render dashboard-only routes if user is not authenticated (prevents flash)
  if (!isAuthenticated && isDashboardOnlyRoute) {
    return <LoadingSpinner />;
  }

  // Determine layout based on authentication and route type
  const useDashboardLayout = shouldUseDashboardLayout();
  const usePublicLayout = shouldUsePublicLayout();

  // Default fallback logic
  let layoutToUse: 'dashboard' | 'public' = 'public';

  if (useDashboardLayout) {
    layoutToUse = 'dashboard';
  } else if (usePublicLayout) {
    layoutToUse = 'public';
  } else {
    // Fallback: if authenticated use dashboard, else use public
    layoutToUse = isAuthenticated ? 'dashboard' : 'public';
  }

  return (
    <div className="min-h-screen transition-all duration-300">
      {layoutToUse === 'dashboard' ? (
        <DashboardLayout user={user}>{children}</DashboardLayout>
      ) : (
        <PublicLayout>{children}</PublicLayout>
      )}
    </div>
  );
}