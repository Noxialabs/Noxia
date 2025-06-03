export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Optional for response objects
  ethAddress?: string;
  tier: UserTierLevel;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: "admin" | "user";
}

// User tier levels
export type UserTierLevel = "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";

// User tier information with ETH balance
export interface UserTier {
  id: string;
  userId: string;
  tier: UserTierLevel;
  ethBalance: number;
  ethAddress: string;
  lastBalanceCheck: Date;
  createdAt: Date;
}

// User registration request
export interface UserRegistrationRequest {
  email: string;
  password: string;
  ethAddress?: string;
}

// User login request
export interface UserLoginRequest {
  email: string;
  password: string;
}

// User profile update request
export interface UserProfileUpdateRequest {
  ethAddress?: string;
}

// User password change request
export interface UserPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// User authentication response
export interface UserAuthResponse {
  user: Omit<User, "passwordHash">;
  token: string;
  refreshToken?: string;
  expiresIn: string;
}

// User session information
export interface UserSession {
  userId: string;
  email: string;
  tier: UserTierLevel;
  isActive: boolean;
  loginAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// User statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsers30d: number;
  usersWithEth: number;
  tierDistribution: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
  };
}

// User tier features and limits
export interface TierFeatures {
  name: UserTierLevel;
  ethRequired: number;
  features: string[];
  limits: {
    casesPerMonth: number;
    documentsPerMonth: number;
    apiRequestsPerMinute: number;
  };
}

// User activity log
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// User preferences
export interface UserPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  caseUpdates: boolean;
  escalationAlerts: boolean;
  documentReady: boolean;
  tierChanges: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User search filters
export interface UserSearchFilters {
  search?: string;
  tier?: UserTierLevel;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserUpdateRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  organization?: string;
  eth_address?: string;
  tier?: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
  role?: "user" | "admin";
  is_active?: boolean;
}

export interface UserSearchFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: "user" | "admin";
  tier?: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
  is_active?: boolean;
  created_from?: string;
  created_to?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  organization?: string;
  eth_address?: string;
  tier: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
