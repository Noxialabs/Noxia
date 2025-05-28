import validator from 'validator';
import { ethers } from 'ethers';

export class ValidationUtils {
  // Email validation
  static isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  // Phone number validation
  static isValidPhone(phone: string): boolean {
    return validator.isMobilePhone(phone, 'any', { strictMode: true });
  }

  // URL validation
  static isValidURL(url: string): boolean {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    });
  }

  // UUID validation
  static isValidUUID(uuid: string): boolean {
    return validator.isUUID(uuid, 4);
  }

  // Ethereum address validation
  static isValidEthAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  // Private key validation
  static isValidEthPrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  // Transaction hash validation
  static isValidTxHash(txHash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
  }

  // File hash validation (SHA-256)
  static isValidFileHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  }

  // Password strength validation
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Case reference validation
  static isValidCaseRef(caseRef: string): boolean {
    return /^999P-\d+-[A-Z0-9]{2,4}$/.test(caseRef);
  }

  // File type validation
  static isValidFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(extension || '');
  }

  // File size validation
  static isValidFileSize(fileSize: number, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return fileSize <= maxSizeInBytes;
  }

  // JSON validation
  static isValidJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  // Date validation
  static isValidDate(dateString: string): boolean {
    return validator.isISO8601(dateString);
  }

  // Age validation
  static isValidAge(birthDate: string, minAge: number = 18): boolean {
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= minAge;
    }
    
    return age >= minAge;
  }

  // Credit card validation
  static isValidCreditCard(cardNumber: string): boolean {
    return validator.isCreditCard(cardNumber);
  }

  // IP address validation
  static isValidIP(ip: string): boolean {
    return validator.isIP(ip);
  }

  // Sanitize string input
  static sanitizeString(input: string): string {
    return validator.escape(input.trim());
  }

  // Normalize email
  static normalizeEmail(email: string): string {
    return validator.normalizeEmail(email) || email;
  }

  // Validate pagination parameters
  static validatePagination(page: any, limit: any): { page: number; limit: number; errors: string[] } {
    const errors: string[] = [];
    let validPage = 1;
    let validLimit = 10;

    // Validate page
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('Page must be a positive integer');
      } else {
        validPage = pageNum;
      }
    }

    // Validate limit
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1) {
        errors.push('Limit must be a positive integer');
      } else if (limitNum > 100) {
        errors.push('Limit cannot exceed 100');
      } else {
        validLimit = limitNum;
      }
    }

    return { page: validPage, limit: validLimit, errors };
  }

  // Validate tier
  static isValidTier(tier: string): boolean {
    const validTiers = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'];
    return validTiers.includes(tier);
  }

  // Validate case status
  static isValidCaseStatus(status: string): boolean {
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Escalated', 'Closed'];
    return validStatuses.includes(status);
  }

  // Validate escalation level
  static isValidEscalationLevel(level: string): boolean {
    const validLevels = ['Basic', 'Priority', 'Urgent'];
    return validLevels.includes(level);
  }

  // Validate priority level
  static isValidPriority(priority: string): boolean {
    const validPriorities = ['Low', 'Normal', 'High', 'Critical'];
    return validPriorities.includes(priority);
  }

  // Validate document type
  static isValidDocumentType(type: string): boolean {
    const validTypes = ['N240', 'N1', 'ET1', 'Other'];
    return validTypes.includes(type);
  }

  // Validate notification type
  static isValidNotificationType(type: string): boolean {
    const validTypes = ['email', 'sms', 'push', 'webhook'];
    return validTypes.includes(type);
  }

  // Comprehensive validation for user registration
  static validateUserRegistration(userData: {
    email: string;
    password: string;
    ethAddress?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Email validation
    if (!this.isValidEmail(userData.email)) {
      errors.push('Invalid email address');
    }

    // Password validation
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }

    // ETH address validation (if provided)
    if (userData.ethAddress && !this.isValidEthAddress(userData.ethAddress)) {
      errors.push('Invalid Ethereum address');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate case submission data
  static validateCaseSubmission(caseData: {
    clientName: string;
    description: string;
    jurisdiction?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Client name validation
    if (!caseData.clientName || caseData.clientName.trim().length < 2) {
      errors.push('Client name must be at least 2 characters');
    }

    if (caseData.clientName && caseData.clientName.length > 255) {
      errors.push('Client name cannot exceed 255 characters');
    }

    // Description validation
    if (!caseData.description || caseData.description.trim().length < 50) {
      errors.push('Case description must be at least 50 characters');
    }

    if (caseData.description && caseData.description.length > 5000) {
      errors.push('Case description cannot exceed 5000 characters');
    }

    // Jurisdiction validation (optional)
    if (caseData.jurisdiction && caseData.jurisdiction.length > 100) {
      errors.push('Jurisdiction cannot exceed 100 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate contact information
  static validateContactInfo(contact: {
    name: string;
    email?: string;
    phone?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contact.name || contact.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (contact.email && !this.isValidEmail(contact.email)) {
      errors.push('Invalid email address');
    }

    if (contact.phone && !this.isValidPhone(contact.phone)) {
      errors.push('Invalid phone number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Remove dangerous characters
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate and sanitize search term
  static validateSearchTerm(term: string): { valid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    
    if (!term || term.trim().length === 0) {
      errors.push('Search term cannot be empty');
    }

    if (term && term.length < 3) {
      errors.push('Search term must be at least 3 characters');
    }

    if (term && term.length > 100) {
      errors.push('Search term cannot exceed 100 characters');
    }

    const sanitized = this.sanitizeInput(term);

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }
}