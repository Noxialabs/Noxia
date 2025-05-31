"use client";

import { CookieHelper } from "@/helper/cookie.helper";
import { UserService } from "@/service/user/user.service";
import { AuthServerUtils } from "@/utils/auth.server";
import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  ethAddress?: string;
  tier: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  });

  /**
   * Initialize auth state from cookies
   */
  const initializeAuth = useCallback(async () => {
    try {
      // Use server utils to get initial state
      const { user, token, isAuthenticated } = AuthServerUtils.getAuthFromCookies();

      if (isAuthenticated && token && user) {
        try {
          // Verify token is still valid by fetching user profile
          const response = await UserService.getUserProfile();

          if (response.success && response.data) {
            setAuthState({
              user: response.data,
              token,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            // Token invalid, clear auth
            await logout();
          }
        } catch (error) {
          console.error("Error validating token:", error);
          await logout();
        }
      } else {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  }, []);

  /**
   * Handle successful login
   */
  const successLogin = async (user: User, token: string) => {
    try {
      // Use server utils to set cookies
      const success = AuthServerUtils.setAuthCookies(user, token);
      
      if (success) {
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });
        return { success: true };
      } else {
        return { success: false, message: "Failed to store authentication" };
      }
    } catch (error: any) {
      setAuthState((prev) => ({ ...prev, loading: false }));
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
      // Use server utils to clear cookies
      AuthServerUtils.clearAuthCookies();

      // Clear state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });

      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
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
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error("Error updating user state:", error);
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      if (!authState.token) return { success: false, message: "No token" };

      const response = await UserService.getUserProfile();

      if (response.success && response.data) {
        updateUserState(response.data);
        return { success: true, data: response.data };
      } else {
        // If profile fetch fails, token might be invalid
        await logout();
        return { success: false, message: "Session expired" };
      }
    } catch (error: any) {
      console.error("User refresh error:", error);
      await logout();
      return { success: false, message: "Session expired" };
    }
  };

  /**
   * Check if user has specific permission based on tier
   */
  const hasPermission = (requiredTier: string): boolean => {
    return AuthServerUtils.hasPermission(requiredTier);
  };

  /**
   * Get user tier information
   */
  const getTierInfo = () => {
    if (!authState.user) return null;

    const tierInfo = {
      'Tier 1': {
        name: 'Basic',
        maxCases: 5,
        features: ['Basic case submission', 'Email support'],
        color: 'gray',
      },
      'Tier 2': {
        name: 'Standard',
        maxCases: 25,
        features: ['Extended forms', 'Email support', 'Document verification'],
        color: 'blue',
      },
      'Tier 3': {
        name: 'Premium',
        maxCases: 100,
        features: ['All forms', 'Priority support', 'Auto-escalation', 'API access'],
        color: 'purple',
      },
      'Tier 4': {
        name: 'Enterprise',
        maxCases: -1, // Unlimited
        features: ['Unlimited access', 'Dedicated support', 'Custom forms', 'Advanced analytics'],
        color: 'gold',
      },
    };

    return tierInfo[authState.user.tier as keyof typeof tierInfo] || tierInfo['Tier 1'];
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

    // Actions
    successLogin,
    logout,
    updateUserState,
    refreshUser,

    // Utilities
    hasPermission,
    getTierInfo,
  };
};