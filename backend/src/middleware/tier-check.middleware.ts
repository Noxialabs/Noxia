import { Request, Response, NextFunction } from 'express';
import { TierModel } from '../models/Tier.model';
import { APIResponse } from '../types';
import { logger } from '../utils/logger.utils';

export const tierCheckMiddleware = (
  requiredTiers: string[],
  options?: {
    checkBalance?: boolean;
    gracePeriod?: number; // Hours to allow stale balance
  }
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required for tier-restricted features.',
          error: 'AUTH_REQUIRED'
        } as APIResponse);
        return;
      }

      const user = req.user;
      const currentTier = user.tier;

      // Check if user's tier is in the required tiers list
      if (!requiredTiers.includes(currentTier)) {
        const lowestRequiredTier = getLowestTier(requiredTiers);
        
        res.status(403).json({
          success: false,
          message: `This feature requires ${lowestRequiredTier} or higher. Your current tier: ${currentTier}`,
          error: 'INSUFFICIENT_TIER',
          details: {
            currentTier,
            requiredTiers,
            upgradeInfo: getTierUpgradeInfo(currentTier, lowestRequiredTier)
          }
        } as APIResponse);
        return;
      }

      // Optional: Check if balance needs to be refreshed
      if (options?.checkBalance && user.ethAddress) {
        try {
          const latestTierInfo = await TierModel.findLatestByUserId(req.userId);
          
          if (latestTierInfo) {
            const hoursSinceCheck = (Date.now() - latestTierInfo.lastBalanceCheck.getTime()) / (1000 * 60 * 60);
            const gracePeriod = options.gracePeriod || 24; // Default 24 hours
            
            if (hoursSinceCheck > gracePeriod) {
              logger.info(`Tier balance check needed for user ${req.userId} (${hoursSinceCheck.toFixed(1)} hours since last check)`);
              
              // Note: You might want to trigger a background balance update here
              // rather than blocking the request
              res.status(200).json({
                success: true,
                message: 'Access granted, but tier balance may be outdated.',
                warning: 'TIER_BALANCE_STALE',
                lastChecked: latestTierInfo.lastBalanceCheck
              } as APIResponse);
            }
          }
        } catch (balanceError) {
          logger.warn('Could not check tier balance:', balanceError);
          // Continue with cached tier rather than failing the request
        }
      }

      // Log tier access for analytics
      logger.debug(`Tier access granted: ${currentTier} for ${req.method} ${req.path}`, {
        userId: req.userId,
        tier: currentTier,
        requiredTiers,
        endpoint: `${req.method} ${req.path}`
      });

      next();
    } catch (error) {
      logger.error('Tier check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during tier verification.',
        error: 'TIER_CHECK_ERROR'
      } as APIResponse);
    }
  };
};

// Helper function to determine the lowest required tier
function getLowestTier(tiers: string[]): string {
  const tierOrder = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'];
  
  for (const tier of tierOrder) {
    if (tiers.includes(tier)) {
      return tier;
    }
  }
  
  return tiers[0]; // Fallback
}

// Helper function to provide upgrade information
function getTierUpgradeInfo(currentTier: string, requiredTier: string): any {
  const tierRequirements = {
    'Tier 1': { ethRequired: 0, features: ['Basic case submission', 'AI classification'] },
    'Tier 2': { ethRequired: 1, features: ['Case escalation', 'Email notifications', 'Document hashing'] },
    'Tier 3': { ethRequired: 5, features: ['Blockchain registration', 'SMS notifications', 'Advanced features'] },
    'Tier 4': { ethRequired: 10, features: ['Full access', 'Admin features', 'Priority support'] }
  };

  const current = tierRequirements[currentTier as keyof typeof tierRequirements];
  const required = tierRequirements[requiredTier as keyof typeof tierRequirements];

  return {
    currentEthRequired: current?.ethRequired || 0,
    requiredEthRequired: required?.ethRequired || 0,
    ethDeficit: (required?.ethRequired || 0) - (current?.ethRequired || 0),
    newFeatures: required?.features || [],
    upgradeInstructions: `Add ${(required?.ethRequired || 0) - (current?.ethRequired || 0)} ETH to your wallet to upgrade to ${requiredTier}`
  };
}

// Specific tier check middlewares for common use cases

// Basic tier check (Tier 1+)
export const basicTierCheck = tierCheckMiddleware(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']);

// Premium tier check (Tier 2+)
export const premiumTierCheck = tierCheckMiddleware(['Tier 2', 'Tier 3', 'Tier 4']);

// Advanced tier check (Tier 3+)
export const advancedTierCheck = tierCheckMiddleware(['Tier 3', 'Tier 4']);

// Admin tier check (Tier 4 only)
export const adminTierCheck = tierCheckMiddleware(['Tier 4']);

// Dynamic tier check based on feature
export const featureBasedTierCheck = (feature: string) => {
  const featureTierMap: { [key: string]: string[] } = {
    'case_submission': ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'],
    'case_escalation': ['Tier 2', 'Tier 3', 'Tier 4'],
    'document_hashing': ['Tier 2', 'Tier 3', 'Tier 4'],
    'blockchain_registration': ['Tier 3', 'Tier 4'],
    'sms_notifications': ['Tier 3', 'Tier 4'],
    'bulk_operations': ['Tier 4'],
    'admin_features': ['Tier 4']
  };

  const requiredTiers = featureTierMap[feature] || ['Tier 4'];
  return tierCheckMiddleware(requiredTiers);
};

// Tier check with balance verification
export const verifiedTierCheck = (requiredTiers: string[]) => {
  return tierCheckMiddleware(requiredTiers, {
    checkBalance: true,
    gracePeriod: 1 // Check balance if older than 1 hour
  });
};