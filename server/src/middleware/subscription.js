import { Subscription } from "../models/Subscription.js";
import { User } from "../models/User.js";
import { getPricing, PRICING_CONFIG } from "../utils/pricing.js";

/**
 * Check if organization's subscription is active
 * Allows requests if free tier, or if paid subscription is active
 */
export async function checkSubscriptionStatus(req, res, next) {
  try {
    const subscription = await Subscription.findOne({ organization: req.organizationId });

    if (!subscription) {
      // No subscription = free tier (allowed)
      req.subscriptionStatus = {
        status: "free",
        tier: 1,
        memberLimit: PRICING_CONFIG.FREE_TIER_LIMIT
      };
      return next();
    }

    // Check subscription status
    const today = new Date();
    if (subscription.status === "active" && subscription.renewalDate > today) {
      req.subscriptionStatus = {
        status: "active",
        tier: subscription.currentTier,
        memberLimit: subscription.memberLimit,
        renewalDate: subscription.renewalDate,
        billingCycle: subscription.billingCycle,
        currentPrice: subscription.currentPrice
      };
      return next();
    }

    if (subscription.status === "expired" || subscription.renewalDate <= today) {
      // Subscription expired, downgrade to free tier
      subscription.status = "expired";
      await subscription.save();

      req.subscriptionStatus = {
        status: "expired",
        tier: 1,
        memberLimit: PRICING_CONFIG.FREE_TIER_LIMIT
      };
      return next();
    }

    if (subscription.status === "cancelled") {
      req.subscriptionStatus = {
        status: "cancelled",
        tier: 1,
        memberLimit: PRICING_CONFIG.FREE_TIER_LIMIT
      };
      return next();
    }

    // Default to free tier
    req.subscriptionStatus = {
      status: "unknown",
      tier: 1,
      memberLimit: PRICING_CONFIG.FREE_TIER_LIMIT
    };
    next();
  } catch (error) {
    console.error("Error checking subscription status:", error);
    // On error, allow free tier access
    req.subscriptionStatus = {
      status: "error",
      tier: 1,
      memberLimit: PRICING_CONFIG.FREE_TIER_LIMIT
    };
    next();
  }
}

/**
 * Check if organization has reached member limit
 * Used when adding new members
 */
export async function checkMemberLimit(req, res, next) {
  try {
    const memberCount = await User.countDocuments({ organization: req.organizationId });
    const subscription = await Subscription.findOne({ organization: req.organizationId });

    let memberLimit = PRICING_CONFIG.FREE_TIER_LIMIT;

    if (subscription && subscription.status === "active") {
      memberLimit = subscription.memberLimit;
    }

    // Check if adding one more member would exceed limit
    if (memberCount >= memberLimit) {
      return res.status(403).json({
        message: `Member limit reached (${memberLimit}). Upgrade subscription to add more members.`,
        currentMembers: memberCount,
        memberLimit,
        needsUpgrade: true
      });
    }

    req.memberCount = memberCount;
    req.memberLimit = memberLimit;
    next();
  } catch (error) {
    console.error("Error checking member limit:", error);
    next(error);
  }
}

/**
 * Warn if organization is approaching member limit
 */
export async function checkMemberWarning(req, res, next) {
  try {
    const memberCount = await User.countDocuments({ organization: req.organizationId });
    const subscription = await Subscription.findOne({ organization: req.organizationId });

    let memberLimit = PRICING_CONFIG.FREE_TIER_LIMIT;

    if (subscription && subscription.status === "active") {
      memberLimit = subscription.memberLimit;
    }

    // Warn if 80% of limit reached
    const warningThreshold = Math.floor(memberLimit * 0.8);

    if (memberCount >= warningThreshold) {
      res.setHeader("X-Member-Warning", `You are approaching your member limit (${memberCount}/${memberLimit})`);
    }

    next();
  } catch (error) {
    console.error("Error checking member warning:", error);
    next();
  }
}

/**
 * Auto-detect if upgrade is needed based on member count
 */
export async function detectUpgradeNeeded(req, res, next) {
  try {
    const memberCount = await User.countDocuments({ organization: req.organizationId });
    const subscription = await Subscription.findOne({ organization: req.organizationId });

    const currentPricing = getPricing(memberCount, "monthly");

    let upgradeNeeded = false;

    if (!subscription) {
      // No subscription yet, check if should be on free or paid tier
      upgradeNeeded = memberCount > PRICING_CONFIG.FREE_TIER_LIMIT;
    } else if (subscription.status === "active") {
      upgradeNeeded = currentPricing.tier > subscription.currentTier;
    }

    if (upgradeNeeded) {
      req.upgradeNeeded = {
        current: subscription?.currentTier || 1,
        recommended: currentPricing.tier,
        currentMembers: memberCount,
        newPrice: currentPricing.totalPrice,
        oldPrice: subscription?.currentPrice || 0
      };
    }

    next();
  } catch (error) {
    console.error("Error detecting upgrade:", error);
    next();
  }
}

/**
 * Require paid subscription
 */
export async function requirePaidSubscription(req, res, next) {
  try {
    const subscription = await Subscription.findOne({
      organization: req.organizationId,
      status: "active"
    });

    if (!subscription) {
      return res.status(403).json({
        message: "This feature requires a paid subscription",
        needsUpgrade: true
      });
    }

    const today = new Date();
    if (subscription.renewalDate <= today) {
      return res.status(403).json({
        message: "Subscription expired. Please renew to use this feature.",
        needsUpgrade: true
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
