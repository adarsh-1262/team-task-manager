# Subscription System - Complete Verification Guide

## What Was Fixed

### 1. **Backend: GET /current Endpoint** ✅
**Critical Issue**: The endpoint was recalculating the subscription tier based on member count, which overwrote the tier that the user had paid for.

**What was wrong:**
```javascript
// OLD CODE - WRONG:
const pricingPlan = getPricing(memberCount, subscription.billingCycle);
// This would always recalculate tier from member count
// Example: User paid for Tier 3, but if they have 5 members, it would show Tier 2
```

**What's fixed:**
```javascript
// NEW CODE - CORRECT:
const pricingPlan = getPricing(memberCount, subscription.billingCycle, false, subscription.currentTier);
// Now uses the tier that was stored in the database when payment was made
// Tier 3 stays as Tier 3, regardless of actual member count
```

### 2. **Backend: /verify-payment Endpoint** ✅
**Added**: Validation that tier is saved correctly after payment

**Changes:**
- Added tier range validation (1-5)
- Fetches fresh subscription before returning response
- Logs all subscription details for debugging

### 3. **Frontend: Billing Dashboard** ✅
**Added**: Debug information section showing tier validation

**Shows:**
- Stored tier from database
- Calculated tier based on members
- Whether they match (they usually should)
- Member limit verification
- Tier consistency status message

## How the System Works Now

### Payment Flow (Step by Step)

```
1. User at Billing Dashboard
   ↓
2. Clicks "Upgrade Now" or "Manage Subscription"
   ↓
3. Selects Tier 3 from modal
   ↓
4. Frontend sends: { selectedTier: 3, memberCount: 15, billingCycle: "monthly" }
   ↓
5. Backend /create-order receives selectedTier=3
   → Calculates: Tier 3 = ₹2,000/month + ₹360 GST = ₹2,360
   → Creates Razorpay order for ₹2,360
   ↓
6. User completes payment in Razorpay modal
   ↓
7. Frontend sends: { orderId, paymentId, signature, selectedTier: 3, ... }
   ↓
8. Backend /verify-payment receives selectedTier=3
   → Verifies payment signature ✓
   → Fetches payment details from Razorpay ✓
   → Calculates pricing with selectedTier=3
   → Creates/updates subscription with currentTier: 3
   → Saves to database
   → Returns saved subscription object
   ↓
9. Frontend receives response with subscription.currentTier = 3
   ↓
10. Frontend shows: "✅ Payment successful! Subscription updated to Tier 3"
    ↓
11. Frontend calls fetchSubscription() to refresh
    ↓
12. Backend /current returns tier 3 using stored value (NOT recalculated)
    ↓
13. Billing Dashboard updates UI to show:
    - Title: "Tier 3"
    - Member limit: "20"
    - Renewal date: (1 month from now)
```

## Data Saved in Database

### Subscription Record
```json
{
  "_id": "...",
  "organization": "...",
  "currentTier": 3,              // ← Tier user paid for
  "memberLimit": 20,            // ← Associated member limit
  "currentPrice": 2360,         // ← Total paid (including GST)
  "status": "active",
  "billingCycle": "monthly",
  "renewalDate": "2026-06-25",
  "memberCount": 15,            // ← Actual current member count
  "razorpayPaymentId": "...",
  "razorpayOrderId": "..."
}
```

### Payment Record
```json
{
  "_id": "...",
  "organization": "...",
  "subscription": "...",
  "amount": 2360,
  "status": "successful",
  "billingCycle": "monthly",
  "razorpayPaymentId": "...",
  "description": "monthly subscription for 15 members"
}
```

### Invoice Record
```json
{
  "_id": "...",
  "organization": "...",
  "subscription": "...",
  "payment": "...",
  "invoiceNumber": "INV-...",
  "amount": 2000,
  "gst": 360,
  "totalAmount": 2360,
  "status": "paid",
  "billingPeriodStart": "2025-05-25",
  "billingPeriodEnd": "2026-06-25"
}
```

## Testing Checklist

### Test Case 1: New User - Free to Tier 3
- [ ] Register new organization
- [ ] Admin dashboard → Billing tab
- [ ] Should show "Free Plan" initially
- [ ] Click "Upgrade Now"
- [ ] Modal shows available tiers
- [ ] Select "Tier 3" (20 members, ₹2,000/month)
- [ ] Modal shows ₹2,360 (including 18% GST)
- [ ] Complete payment with Razorpay test card
- [ ] Payment modal closes
- [ ] Dashboard shows "✅ Payment successful! Subscription updated to Tier 3"
- [ ] Wait 1-2 seconds
- [ ] Dashboard updates to show:
  - [ ] Title: "Tier 3"
  - [ ] Members: "0/20"
  - [ ] Billing Cycle: "Monthly"
  - [ ] Renewal Date: (1 month from today)
- [ ] Check debug section shows:
  - [ ] Stored Tier: 3
  - [ ] Calculated Tier: 3
  - [ ] Tier Match: ✅ Yes
  - [ ] Message: "✅ Tier and pricing consistent"
- [ ] Refresh page → Should still show "Tier 3" (NOT recalculated to Free)

### Test Case 2: Tier 2 to Tier 3 Upgrade
- [ ] User has existing Tier 2 subscription
- [ ] Admin → Billing → Shows "Tier 2", "10" members
- [ ] Click "Manage Subscription"
- [ ] Modal shows Tier 3 option
- [ ] Select "Tier 3"
- [ ] Modal shows ₹2,360 (full price, not difference)
- [ ] Complete payment
- [ ] Dashboard updates to "Tier 3", "20" member limit
- [ ] Payment record created for ₹2,360
- [ ] Refresh page → Still shows Tier 3

### Test Case 3: Annual Billing
- [ ] Free user upgrades to Tier 3 Annual
- [ ] Select "Annual" tab in modal
- [ ] Should show ₹20,400 base + ₹3,072 GST = ₹23,472
- [ ] Complete payment for ₹23,472
- [ ] Dashboard shows:
  - [ ] Tier 3
  - [ ] Billing Cycle: "Annual"
  - [ ] Renewal Date: (1 year from today)
- [ ] Subscription record has billingCycle: "annual"

## Debugging Information

### If Tier Shows Incorrectly

**Check 1: Browser Console**
- Open DevTools (F12) → Console
- Should see logs like:
  ```
  "Subscription data received:" {...}
  "Stored Tier: 3"
  "Calculated Tier: 3"
  "Tier Match: ✅ Yes"
  ```

**Check 2: Debug Section in UI**
- Look for the gray box under "Refresh Data" button
- Should show tier validation results
- If "Tier Match: ⚠️ No" → Something is wrong

**Check 3: Network Tab**
- Open DevTools → Network tab
- Find `/subscription/current` request
- Check response body → Should have `subscription.currentTier` correct

**Check 4: Server Logs**
- Look at backend console/logs
- Search for: "Subscription found for org"
- Should show: `"tier": 3` (not calculated tier)

**Check 5: Database**
- Query subscriptions collection:
  ```
  db.subscriptions.findOne({organization: ObjectId("...")})
  ```
- Check `currentTier` field (should be 3)
- Check `memberLimit` field (should be 20)

## Tier Pricing Reference

| Tier | Type | Members | Monthly | Annual | Monthly+GST | Annual+GST |
|------|------|---------|---------|--------|-------------|------------|
| 1 | Free | 1-3 | ₹0 | ₹0 | ₹0 | ₹0 |
| 2 | Pro | 4-10 | ₹1,000 | ₹10,200 | ₹1,180 | ₹12,036 |
| 3 | Pro | 11-20 | ₹2,000 | ₹20,400 | ₹2,360 | ₹24,072 |
| 4 | Pro | 21-30 | ₹3,000 | ₹30,600 | ₹3,540 | ₹36,108 |
| 5 | Pro | 31-40 | ₹4,000 | ₹40,800 | ₹4,720 | ₹48,144 |

*Annual pricing includes 15% discount. All prices include 18% GST.*

## Files Modified

1. **server/src/routes/subscriptionRoutes.js**
   - Line ~20: GET /current endpoint - uses stored tier
   - Line ~60: Added debug info with tier validation
   - Line ~210: POST /verify-payment - added tier validation
   - Line ~270: /verify-payment returns fresh subscription

2. **client/src/BillingDashboard.jsx**
   - Line ~10: Added debugInfo state
   - Line ~20: fetchSubscription() stores debug info
   - Line ~65: Added debug section in UI
   - Line ~400: Enhanced handlePaymentSuccess() logging

3. **server/src/utils/pricing.js**
   - No changes (already correct)
   - Tier 3 pricing: ₹2,000/month, 20 members

## FAQ

**Q: Why does the backend recalculate pricing?**
A: It's needed for two reasons:
1. To show users what tier they would get with their current member count
2. To validate that the selected tier makes sense for the member count

But we always **save and return** the tier the user **paid for**, not the calculated tier.

**Q: What if member count changes after payment?**
A: The subscription stays at the tier they paid for (e.g., Tier 3) until they manually upgrade/downgrade or the system detects an issue.

**Q: Can I downgrade a subscription?**
A: Not yet - the current system only supports upgrades.

**Q: What happens at renewal?**
A: The subscription automatically renews at the same tier and billing cycle unless cancelled.

**Q: Is the system case-sensitive for organization linking?**
A: No, MongoDB ObjectIds are used for all links (no string matching).

## Support

If tier is not updating:
1. Check browser console for errors
2. Check "📊 Subscription Status" debug section
3. Verify payment was "successful" in Razorpay dashboard
4. Check database: `db.subscriptions.findOne({organization: ...})`
5. Contact support with:
   - Organization ID
   - Selected tier
   - Amount paid
   - Razorpay payment ID
