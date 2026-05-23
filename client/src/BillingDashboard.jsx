import React, { useEffect, useState } from "react";
import { CreditCard, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function BillingDashboard({ token }) {
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [billingHistory, setBillingHistory] = useState({ payments: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  async function fetchSubscription() {
    try {
      setLoading(true);
      console.log("Fetching subscription from backend...");
      
      const response = await fetch(`${API_URL}/subscription/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch subscription");

      const data = await response.json();
      console.log("Subscription data received:", data);
      
      setSubscription(data.subscription);
      setPlan(data.plan);
      setMemberCount(data.memberCount);
      setError(""); // Clear any errors

      // Fetch billing history
      const historyResponse = await fetch(`${API_URL}/subscription/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log("Billing history received:", historyData);
        setBillingHistory(historyData);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscription();
  }, [token]);

  if (loading) return <div className="panel">Loading billing information...</div>;

  const isFreeTier = !subscription || subscription.status === "free";
  
  // Use subscription's stored tier/limit if available, otherwise use calculated pricing
  const displayTier = subscription?.currentTier || plan?.tier;
  const displayMemberLimit = subscription?.memberLimit || plan?.memberLimit;
  
  const isNearLimit = memberCount >= Math.floor((displayMemberLimit || 3) * 0.8);
  const isPastRenewal = subscription && new Date(subscription.renewalDate) < new Date();

  console.log("BillingDashboard state:", {
    isFreeTier,
    subscription: subscription ? { id: subscription._id, status: subscription.status, tier: subscription.currentTier, memberLimit: subscription.memberLimit } : null,
    plan: plan ? { tier: plan.tier, memberLimit: plan.memberLimit } : null,
    displayTier,
    displayMemberLimit,
    memberCount
  });

  return (
    <section className="billingDashboard">
      <h2>Billing & Subscription</h2>

      {error && <div className="notice error">{error}</div>}

      {/* Refresh Button */}
      <button 
        onClick={() => {
          console.log("Manual refresh clicked");
          fetchSubscription();
        }}
        style={{ marginBottom: "10px", padding: "5px 10px", cursor: "pointer" }}
      >
        🔄 Refresh Data
      </button>

      {/* Current Plan Card */}
      <div className="planCard">
        <div className="planCardHeader">
          <div>
            <h3>{isFreeTier ? "Free Plan" : `Tier ${displayTier}`}</h3>
            <p className="planStatus">
              {isFreeTier ? "No payment required" : `₹${plan?.pricePerPeriod?.toLocaleString()}/month`}
            </p>
          </div>
          <div className="planIcon">
            {isFreeTier ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
          </div>
        </div>

        <div className="planDetails">
          <div className="planDetail">
            <span>Members</span>
            <strong>
              {memberCount}/{displayMemberLimit}
            </strong>
          </div>
          <div className="planDetail">
            <span>Billing Cycle</span>
            <strong>{subscription?.billingCycle === "annual" ? "Annual" : "Monthly"}</strong>
          </div>
          {subscription && (
            <div className="planDetail">
              <span>Renewal Date</span>
              <strong>{new Date(subscription.renewalDate).toLocaleDateString()}</strong>
            </div>
          )}
        </div>

        {/* Warnings */}
        {isFreeTier && memberCount > 0 && (
          <div className="planWarning">
            <AlertCircle size={18} />
            <p>Upgrade to add more members</p>
          </div>
        )}

        {isNearLimit && !isFreeTier && (
          <div className="planWarning warning">
            <TrendingUp size={18} />
            <p>You're approaching your member limit</p>
          </div>
        )}

        {isPastRenewal && (
          <div className="planWarning danger">
            <Clock size={18} />
            <p>Subscription renewal is overdue</p>
          </div>
        )}

        {/* Action Button */}
        {!isFreeTier && !isPastRenewal && (
          <button className="secondary" onClick={() => setShowUpgradeModal(true)}>
            Manage Subscription
          </button>
        )}

        {isFreeTier && memberCount > 0 && (
          <button onClick={() => setShowUpgradeModal(true)}>Upgrade Now</button>
        )}

        {isPastRenewal && (
          <button onClick={() => setShowUpgradeModal(true)}>Renew Subscription</button>
        )}
      </div>

      {/* Usage & Limits */}
      <div className="usageSection">
        <h4>Member Usage</h4>
        <div className="usageBar">
          <div className="usageFill" style={{ width: `${(memberCount / displayMemberLimit) * 100}%` }} />
        </div>
        <p className="usageText">
          {memberCount}/{displayMemberLimit} members
          {isNearLimit && <span className="warning"> (80% capacity)</span>}
        </p>
      </div>

      {/* Pricing Info */}
      {isFreeTier && memberCount === 0 && (
        <div className="pricingInfo">
          <h4>Our Pricing</h4>
          <div className="pricingTier">
            <div>
              <strong>Free</strong>
              <span>Up to 3 members</span>
            </div>
            <span className="price">₹0</span>
          </div>
          <div className="pricingTier">
            <div>
              <strong>Pro</strong>
              <span>Per 10 members</span>
            </div>
            <span className="price">₹1,000/month</span>
          </div>
          <p className="pricingNote">
            18% GST will be added to all paid plans. Annual plans include 15% discount.
          </p>
        </div>
      )}

      {/* Billing History */}
      {billingHistory.payments.length > 0 && (
        <div className="billingHistory">
          <h4>Recent Payments</h4>
          <div className="historyTable">
            <div className="historyHeader">
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {billingHistory.payments.map((payment) => (
              <div className="historyRow" key={payment._id}>
                <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                <span>₹{(payment.amount).toLocaleString()}</span>
                <span className={`status ${payment.status}`}>{payment.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {billingHistory.invoices.length > 0 && (
        <div className="invoiceSection">
          <h4>Invoices</h4>
          <div className="invoiceList">
            {billingHistory.invoices.map((invoice) => (
              <div className="invoiceItem" key={invoice._id}>
                <div>
                  <strong>{invoice.invoiceNumber}</strong>
                  <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <strong>₹{invoice.totalAmount?.toLocaleString()}</strong>
                  <span className={`status ${invoice.status}`}>{invoice.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          currentPlan={plan}
          currentTier={subscription?.currentTier || 1}
          memberCount={memberCount}
          billingCycle={subscription?.billingCycle || "monthly"}
          onClose={() => {
            console.log("Closing upgrade modal");
            setShowUpgradeModal(false);
          }}
          onUpgradeSuccess={() => {
            console.log("Upgrade success - closing modal and refetching subscription");
            setShowUpgradeModal(false);
            fetchSubscription();
          }}
          token={token}
        />
      )}
    </section>
  );
}

function UpgradeModal({ currentPlan, currentTier, memberCount, billingCycle, onClose, onUpgradeSuccess, token }) {
  const [selectedCycle, setSelectedCycle] = useState(billingCycle || "monthly");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await fetch(`${API_URL}/subscription/pricing/plans`);
      const data = await response.json();
      setPlans(data.plans);
    } catch (err) {
      setError("Failed to fetch plans");
    }
  }

  async function handleUpgrade(plan) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/subscription/create-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memberCount: Math.ceil(memberCount),
          billingCycle: selectedCycle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const data = await response.json();

      // Validate order data
      if (!data.checkoutOptions || !data.checkoutOptions.order_id) {
        throw new Error("Invalid order response from server");
      }

      console.log("Order created:", data.checkoutOptions.order_id);

      // Close modal before opening Razorpay
      onClose();

      // Wait a moment for modal to close before opening Razorpay
      setTimeout(() => {
        if (!window.Razorpay) {
          setError("Razorpay script failed to load. Please refresh the page.");
          return;
        }

        const razorpay = new window.Razorpay({
          ...data.checkoutOptions,
          handler: handlePaymentSuccess,
          modal: {
            ondismiss: () => {
              console.log("Payment modal dismissed by user");
            }
          },
          theme: {
            color: "#3b82f6",
            hide_topbar: false
          }
        });

        razorpay.on("payment.failed", function (response) {
          console.error("Payment failed:", response);
          setError(`Payment failed: ${response.error.description}`);
        });

        razorpay.open();
      }, 300);
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function handlePaymentSuccess(response) {
    try {
      console.log("Payment response received:", response);

      // Validate response has all required fields
      if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
        throw new Error("Missing payment details from Razorpay");
      }

      console.log("Verifying payment signature...");

      const verifyResponse = await fetch(`${API_URL}/subscription/verify-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          memberCount: Math.ceil(memberCount),
          billingCycle: selectedCycle
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.error("Verification failed:", verifyData);
        setError(verifyData.message || "Payment verification failed");
        return;
      }

      console.log("Payment verified successfully!", verifyData);
      console.log("Calling onUpgradeSuccess to refresh UI...");
      
      // Show success notification
      setError(""); // Clear any errors
      
      // Call parent's callback to close modal and refetch data
      onUpgradeSuccess();
    } catch (err) {
      console.error("Payment verification error:", err);
      setError(err.message || "An error occurred during payment verification");
    }
  }

  return (
    <div className="modal overlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Upgrade Subscription</h3>
          <button className="closeButton" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="notice error">{error}</div>}

        {/* Billing Cycle Toggle */}
        <div className="billingToggle">
          <button
            className={selectedCycle === "monthly" ? "active" : ""}
            onClick={() => setSelectedCycle("monthly")}
          >
            Monthly
          </button>
          <button
            className={selectedCycle === "annual" ? "active" : ""}
            onClick={() => setSelectedCycle("annual")}
          >
            Annual
            <span className="badge">Save 15%</span>
          </button>
        </div>

        {/* Plans */}
        <div className="plansGrid">
          {plans.map((plan) => {
            const price = selectedCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const isCurrentPlan = plan.tier === currentTier;
            const isBetter = plan.tier > currentTier;

            return (
              <div className={`planOption ${isCurrentPlan ? "current" : ""} ${isBetter ? "upgrade" : ""}`} key={plan.tier}>
                <div className="planName">
                  <strong>{plan.type === "free" ? "Free" : `Tier ${plan.tier}`}</strong>
                  {isCurrentPlan && <span className="badge primary">Current</span>}
                </div>

                <div className="planPrice">
                  <strong>₹{price.toLocaleString()}</strong>
                  <span>/{selectedCycle === "monthly" ? "month" : "year"}</span>
                </div>

                <div className="planFeatures">
                  <p>Up to {plan.memberLimit} members</p>
                  {plan.type === "pro" && <p>✓ Priority support</p>}
                  {plan.type === "pro" && <p>✓ Advanced analytics</p>}
                </div>

                {!isCurrentPlan && isBetter && (
                  <button onClick={() => handleUpgrade(plan)} disabled={loading}>
                    {loading ? "Processing..." : "Choose Plan"}
                  </button>
                )}

                {isCurrentPlan && <button className="secondary" disabled>Current Plan</button>}

                {!isBetter && !isCurrentPlan && (
                  <button className="secondary" disabled>
                    Downgrade
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="modalNote">*18% GST will be added to the final amount</p>
      </div>
    </div>
  );
}
