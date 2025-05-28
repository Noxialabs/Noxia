"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CookieHelper } from "@/helper/cookie.helper";
import { UserService } from "@/service/user/user.service";
import { useRouter } from "next/navigation";

interface User {
  id?: string | number;
  email?: string;
  ethAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, ethAddress?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { ethAddress?: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const refreshUser = async () => {
    try {
      const token = CookieHelper.get({ key: "token" });
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const response = await UserService.getUserProfile();
      if (response.data && !response.data.error) {
        const userData = response.data.data || response.data;
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setError("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setIsAuthenticated(false);
      setError("An error occurred while fetching user profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserService.login({ email, password });
      if (response.data && !response.data.error) {
        const token = response.data.token || response.data.data?.token;
        if (token) {
          CookieHelper.set({ key: "token", value: token });
          await refreshUser();
          return true;
        } else {
          setError("Authentication failed. No token received.");
          return false;
        }
      } else {
        setError(response.data?.message || "Login failed. Please check your credentials.");
        return false;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Login failed. Please check your credentials.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, ethAddress?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserService.register({ email, password, ethAddress });
      if (response.data && !response.data.error) {
        return true;
      } else {
        setError(response.data?.message || "Registration failed. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    UserService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/");
  };

  const updateProfile = async (data: { ethAddress?: string }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserService.updateProfile(data);
      if (response.data && !response.data.error) {
        await refreshUser();
        return true;
      } else {
        setError(response.data?.message || "Failed to update profile. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.response?.data?.message || "Failed to update profile. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await UserService.changePassword({
        currentPassword,
        newPassword,
      });
      if (response.data && !response.data.error) {
        return true;
      } else {
        setError(response.data?.message || "Failed to change password. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      setError(error.response?.data?.message || "Failed to change password. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
