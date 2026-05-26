// Pricing configuration
export const PRICING_CONFIG = {
  FREE_TIER_LIMIT: 3,
  PRICE_PER_10_MEMBERS: 1000,
  ANNUAL_DISCOUNT: 0.15,
  CURRENCY: "INR",
  GST_PERCENTAGE: 18
};

/**
 * Calculate subscription tier based on member count
 * Tier 1 (Free): 1-3 members
 * Tier 2: 4-10 members (₹1000/month)
 * Tier 3: 11-20 members (₹2000/month)
 * Tier 4: 21-30 members (₹3000/month)
 * Tier 5: 31-40 members (₹4000/month), etc.
 */
export function calculateTier(memberCount) {
  if (memberCount <= 3) {
    return { tier: 1, type: "free", monthlyPrice: 0, annualPrice: 0, memberLimit: 3 };
  }

  if (memberCount <= 10) {
    const monthlyPrice = 1000;
    const annualPrice = monthlyPrice * 12 * (1 - PRICING_CONFIG.ANNUAL_DISCOUNT);
    return {
      tier: 2,
      type: "pro",
      monthlyPrice,
      annualPrice,
      memberLimit: 10
    };
  }

  // For members > 10, calculate tier (tier 3, 4, 5, etc.)
  const tier = Math.floor((memberCount - 10 - 1) / 10) + 3;
  const monthlyPrice = (tier - 1) * PRICING_CONFIG.PRICE_PER_10_MEMBERS;
  const annualPrice = monthlyPrice * 12 * (1 - PRICING_CONFIG.ANNUAL_DISCOUNT);
  const memberLimit = tier * 10 - 10;

  return {
    tier,
    type: "pro",
    monthlyPrice,
    annualPrice,
    memberLimit
  };
}

/**
 * Get tier info for a specific tier number (used when user explicitly selects a tier)
 */
function getTierInfo(tier) {
  if (tier === 1) {
    return { tier: 1, type: "free", monthlyPrice: 0, annualPrice: 0, memberLimit: 3 };
  }
  
  if (tier === 2) {
    const monthlyPrice = 1;
    const annualPrice = monthlyPrice * 12 * (1 - PRICING_CONFIG.ANNUAL_DISCOUNT);
    return { tier: 2, type: "pro", monthlyPrice, annualPrice, memberLimit: 10 };
  }
  
  if (tier === 3) {
    const monthlyPrice = 2000;
    const annualPrice = monthlyPrice * 12 * (1 - PRICING_CONFIG.ANNUAL_DISCOUNT);
    return { tier: 3, type: "pro", monthlyPrice, annualPrice, memberLimit: 20 };
  }
  
  if (tier === 4) {
    const monthlyPrice = 3000;
    const annualPrice = monthlyPrice * 12 * (1 - PRICING_CONFIG.ANNUAL_DISCOUNT);
    return { tier: 4, type: "pro", monthlyPrice, annualPrice, memberLimit: 30 };
  }
  
  // For tier 5+, calculate dynamically
  const monthlyPrice = (tier - 1) * PRICING_CONFIG.PRICE_PER_10_MEMBERS;
  const annualPrice = monthlyPrice * 12 * (1 - PRICING_CONFIG.ANNUAL_DISCOUNT);
  const memberLimit = tier * 10 - 10;
  return { tier, type: "pro", monthlyPrice, annualPrice, memberLimit };
}

/**
 * Get pricing for a specific member count or tier
 * When forceMinimumPaid is true, ensures at least minimum paid tier pricing
 * When selectedTier is provided, uses that tier's pricing instead of calculating
 */
export function getPricing(memberCount, billingCycle = "monthly", forceMinimumPaid = false, selectedTier = null) {
  // ✅ If a specific tier is selected by user, use that tier directly
  let tierInfo;
  
  if (selectedTier) {
    // User explicitly selected a tier - use that tier's pricing
    console.log(`Using explicitly selected tier: ${selectedTier}`);
    tierInfo = getTierInfo(selectedTier);
  } else {
    // Calculate tier based on member count
    const pricingMemberCount = forceMinimumPaid ? Math.max(memberCount, 4) : memberCount;
    tierInfo = calculateTier(pricingMemberCount);
  }

  if (tierInfo.type === "free") {
    return {
      tier: 1,
      type: "free",
      memberCount,
      memberLimit: PRICING_CONFIG.FREE_TIER_LIMIT,
      monthlyPrice: 0,
      annualPrice: 0,
      pricePerPeriod: 0,
      billingCycle,
      canUpgrade: true
    };
  }

  const price = billingCycle === "annual" ? tierInfo.annualPrice : tierInfo.monthlyPrice;
  const gst = (price * PRICING_CONFIG.GST_PERCENTAGE) / 100;
  const totalPrice = price + gst;

  return {
    tier: tierInfo.tier,
    type: "pro",
    memberCount,
    memberLimit: tierInfo.memberLimit,
    basePrice: price,
    gst,
    totalPrice,
    monthlyPrice: tierInfo.monthlyPrice,
    annualPrice: tierInfo.annualPrice,
    pricePerPeriod: price,
    billingCycle,
    annualSavings: tierInfo.monthlyPrice * 12 - tierInfo.annualPrice
  };
}

/**
 * Calculate next renewal date
 */
export function getNextRenewalDate(billingCycle) {
  const today = new Date();
  if (billingCycle === "monthly") {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  } else {
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear;
  }
}

/**
 * Check if organization needs upgrade
 */
export function needsUpgrade(currentTier, newMemberCount) {
  const currentPricing = getPricing(currentTier);
  const newPricing = getPricing(newMemberCount);

  return currentPricing.tier < newPricing.tier;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(5, "0");
  return `INV-${year}${month}${day}-${random}`;
}

/**
 * Format price for display
 */
export function formatPrice(amount, cycle = "monthly") {
  const symbol = "₹";
  const period = cycle === "annual" ? "/year" : "/month";
  return `${symbol}${amount.toLocaleString("en-IN")}${period}`;
}
