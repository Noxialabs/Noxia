// hooks/useAuth.ts
"use client";

import { CookieHelper } from "@/helper/cookie.helper";
import { UserService } from "@/service/user/user.service";
import { AuthServerUtils } from "@/utils/auth.server";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  ethAddress?: string;
  tier: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  /**
   * Initialize auth state from cookies
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      // Check for token in cookies
      const token = CookieHelper.get({ key: "token" });

      if (!token) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
        return;
      }

      try {
        // Verify token is still valid by fetching user profile
        const response = await UserService.getUserProfile();

        if (response.data && !response.data.error) {
          const userData = response.data.data || response.data;
          setAuthState({
            user: userData,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } else {
          // Token invalid, clear auth
          await logout();
        }
      } catch (error) {
        console.error("Error validating token:", error);
        await logout();
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: "Failed to initialize authentication",
      });
    }
  }, []);

  /**
   * Handle successful login
   */
  const successLogin = async (userData: User, token: string) => {
    try {
      // Store token in cookies
      CookieHelper.set({
        key: "token",
        value: token,
        expires: 30 * 24 * 60 * 60, // 30 days
      });

      // Store user in cookies
      CookieHelper.set({
        key: "user",
        value: JSON.stringify(userData),
        expires: 30 * 24 * 60 * 60,
      });

      setAuthState({
        user: userData,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "An error occurred during login",
      }));
      console.error("Login error:", error);
      return {
        success: false,
        message: error.message || "An error occurred during login",
      };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Call logout service
      await UserService.logout();
    } catch (error) {
      console.error("Logout service error:", error);
    } finally {
      // Clear cookies
      CookieHelper.destroy({ key: "token" });
      CookieHelper.destroy({ key: "user" });

      // Clear state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });

      // Redirect to home page
      if (typeof window !== "undefined") {
        router.push("/");
      }
    }
  };

  /**
   * Update user profile in state and cookies
   */
  const updateUserState = (updatedUser: User) => {
    try {
      // Update cookies
      CookieHelper.set({
        key: "user",
        value: JSON.stringify(updatedUser),
        expires: 30 * 24 * 60 * 60,
      });

      // Update state
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error("Error updating user state:", error);
      setAuthState((prev) => ({
        ...prev,
        error: "Failed to update user state",
      }));
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      if (!authState.token) {
        const token = CookieHelper.get({ key: "token" });
        if (!token) {
          return { success: false, message: "No token" };
        }
      }

      const response = await UserService.getUserProfile();

      if (response.data && !response.data.error) {
        const userData = response.data.data || response.data;
        updateUserState(userData);
        return { success: true, data: userData };
      } else {
        // If profile fetch fails, token might be invalid
        await logout();
        return { success: false, message: "Session expired" };
      }
    } catch (error: any) {
      console.error("User refresh error:", error);
      setAuthState((prev) => ({
        ...prev,
        error: "Failed to refresh user data",
      }));
      await logout();
      return { success: false, message: "Session expired" };
    }
  };

  /**
   * Check if user has specific permission based on tier
   */
  const hasPermission = (requiredTier: string): boolean => {
    if (!authState.user) return false;

    const tierLevels = {
      free: 1,
      premium: 2,
      enterprise: 3,
    };

    const userLevel =
      tierLevels[authState.user.tier as keyof typeof tierLevels] || 0;
    const requiredLevel =
      tierLevels[requiredTier as keyof typeof tierLevels] || 0;

    return userLevel >= requiredLevel;
  };

  /**
   * Clear any auth errors
   */
  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    // State
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,

    // Actions
    successLogin,
    logout,
    updateUserState,
    refreshUser,
    clearError,

    // Utilities
    hasPermission,
  };
};
