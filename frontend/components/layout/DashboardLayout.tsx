"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; // Use your custom hook
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import DashboardNavbar from "./DashboardNavbar";
import LoadingSpinner from "./LoadingSpinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated, loading, user: authUser } = useAuth(); // Use your custom hook
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated after loading is complete
    if (!loading && !isAuthenticated) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <DashboardNavbar user={authUser || user} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="animate-fadeIn">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
