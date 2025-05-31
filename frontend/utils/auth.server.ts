// utils/auth.server.ts
import { CookieHelper } from "@/helper/cookie.helper";

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

/**
 * Server-side auth utilities that work in both server and client components
 */
export class AuthServerUtils {
  /**
   * Get authentication state from cookies (works in server components)
   */
  static getAuthFromCookies(context?: any) {
    try {
      const token = CookieHelper.get({ key: "token", context });
      const userString = CookieHelper.get({ key: "user", context });

      if (token && userString) {
        try {
          const user = JSON.parse(userString);
          return {
            user,
            token,
            isAuthenticated: true,
          };
        } catch (error) {
          console.error("Error parsing user data:", error);
          return {
            user: null,
            token: null,
            isAuthenticated: false,
          };
        }
      }

      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    } catch (error) {
      console.error("Auth cookie reading error:", error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
      };
    }
  }

  /**
   * Store auth data in cookies (works in server actions)
   */
  static setAuthCookies(user: User, token: string, context?: any) {
    try {
      CookieHelper.set({
        key: "token",
        value: token,
        expires: 30 * 24 * 60 * 60, // 30 days
        context,
      });

      CookieHelper.set({
        key: "user",
        value: JSON.stringify(user),
        expires: 30 * 24 * 60 * 60, // 30 days
        context,
      });

      return true;
    } catch (error) {
      console.error("Error setting auth cookies:", error);
      return false;
    }
  }

  /**
   * Clear auth cookies (works in server actions)
   */
  static clearAuthCookies(context?: any) {
    try {
      CookieHelper.destroy({ key: "token", context });
      CookieHelper.destroy({ key: "user", context });
      return true;
    } catch (error) {
      console.error("Error clearing auth cookies:", error);
      return false;
    }
  }

  /**
   * Check if user is authenticated (server-side)
   */
  static isAuthenticated(context?: any): boolean {
    const { isAuthenticated } = AuthServerUtils.getAuthFromCookies(context);
    return isAuthenticated;
  }

  /**
   * Get current user (server-side)
   */
  static getCurrentUser(context?: any): User | null {
    const { user } = AuthServerUtils.getAuthFromCookies(context);
    return user;
  }

  /**
   * Get current token (server-side)
   */
  static getCurrentToken(context?: any): string | null {
    const { token } = AuthServerUtils.getAuthFromCookies(context);
    return token;
  }

  /**
   * Check user tier permissions (server-side)
   */
  static hasPermission(requiredTier: string, context?: any): boolean {
    const user = AuthServerUtils.getCurrentUser(context);
    if (!user) return false;

    const tierLevels = {
      'Tier 1': 1,
      'Tier 2': 2,
      'Tier 3': 3,
      'Tier 4': 4,
    };

    const userTierLevel = tierLevels[user.tier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[requiredTier as keyof typeof tierLevels] || 0;

    return userTierLevel >= requiredTierLevel;
  }
}

/**
 * Server Actions for authentication
 */
export async function serverLogin(user: User, token: string) {
}

export async function serverLogout() {
  return AuthServerUtils.clearAuthCookies();
}

/**
 * Middleware helper for protected routes
 */
export function withAuth<T extends any[]>(
  handler: (...args: T) => any,
  requiredTier?: string
) {
  return (...args: T) => {
    const isAuth = AuthServerUtils.isAuthenticated();
    
    if (!isAuth) {
      throw new Error("Authentication required");
    }

    if (requiredTier && !AuthServerUtils.hasPermission(requiredTier)) {
      throw new Error("Insufficient permissions");
    }

    return handler(...args);
  };
}