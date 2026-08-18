import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, CreditCard, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { usePodcast } from "../context/PodcastContext";

export default function UpgradeModal() {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen, setUserRole, showToast } = usePodcast();
  const [billingPeriod, setBillingPeriod] = useState("monthly"); // monthly | annual
  const [selectedPlan, setSelectedPlan] = useState("Pro"); // Pro | Enterprise
  
  // Checkout Form States
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const validateForm = () => {
    const errs = {};
    if (!cardName.trim()) errs.cardName = "Name is required";
    if (cardNumber.replace(/\s/g, "").length !== 16) errs.cardNumber = "Must be a 16-digit card number";
    if (!expiry.includes("/") || expiry.length < 5) errs.expiry = "Use MM/YY format";
    if (cvc.length < 3 || cvc.length > 4) errs.cvc = "Must be 3 or 4 digits";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setUserRole(selectedPlan === "Pro" ? "Pro Creator" : "Enterprise Creator");
      showToast(`Welcome! Successfully upgraded to ${selectedPlan === "Pro" ? "Pro Creator" : "Enterprise"} plan!`);
      setIsUpgradeModalOpen(false);
      // Reset checkout
      setShowCheckout(false);
      setCardName("");
      setCardNumber("");
      setExpiry("");
      setCvc("");
    }, 2000);
  };

  const planDetails = {
    Pro: {
      monthly: 29,
      annual: 23, // 20% off approx
      features: [
        "Unlimited Podcast Audio Uploads",
        "Advanced Models (Gemini 2.5 Pro Routing)",
        "Automated Reel clips generator (95%+ accuracy)",
        "3D Interactive Flashcards & MindMaps",
        "Full AI Host Twin Voice Synthesis (Casual & Debate)"
      ]
    },
    Enterprise: {
      monthly: 149,
      annual: 119,
      features: [
        "Everything in Pro Creator plan",
        "Custom trained AI Host models per show",
        "Dedicated API key routing endpoints",
        "Full multi-user team workspace collaboration",
        "Priority codec queues & server-side streaming"
      ]
    }
  };

  return (
    <AnimatePresence>
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-4xl bg-[#13131A] border border-white/10 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsUpgradeModalOpen(false);
                setShowCheckout(false);
              }}
              className="absolute right-4 top-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Plan selection & details */}
            <div className="flex-1 p-8 overflow-y-auto border-r border-white/5 scrollbar-thin">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary uppercase">
                  Premium Access
                </span>
              </div>
              <h2 className="text-xl font-heading font-extrabold text-white">Upgrade Creator Workspace</h2>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Scale your production pipeline and unlock high-definition transcript models.
              </p>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-3 bg-white/[0.02] border border-white/5 p-1 rounded-xl w-fit mx-auto mt-6">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    billingPeriod === "monthly" ? "bg-primary text-white shadow-neon-purple" : "text-text-muted hover:text-white"
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingPeriod === "annual" ? "bg-primary text-white shadow-neon-purple" : "text-text-muted hover:text-white"
                  }`}
                >
                  <span>Annual billing</span>
                  <span className="px-1.5 py-0.5 rounded bg-success/20 text-success text-[8px] font-extrabold">Save 20%</span>
                </button>
              </div>

              {/* Pricing Cards selection */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {["Pro", "Enterprise"].map((plan) => {
                  const details = planDetails[plan];
                  const price = billingPeriod === "monthly" ? details.monthly : details.annual;
                  const isSelected = selectedPlan === plan;

                  return (
                    <div
                      key={plan}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowCheckout(false);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 relative ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-neon-purple"
                          : "bg-white/[0.01] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{plan} Creator</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <h4 className="text-xl font-extrabold text-white mt-2">
                          ${price}
                          <span className="text-[10px] text-text-muted font-medium">/mo</span>
                        </h4>
                        <span className="text-[8px] text-text-muted mt-1 block">
                          Billed {billingPeriod === "monthly" ? "monthly" : "annually"}
                        </span>
                      </div>
                      <span className="text-[9px] text-primary font-bold hover:underline">View features below</span>
                    </div>
                  );
                })}
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-2.5">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Features included:</h4>
                {planDetails[selectedPlan].features.map((f, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-xs font-medium text-slate-300">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Checkout or Plan Overview */}
            <div className="flex-1 p-8 bg-[#0D0D12]/50 flex flex-col justify-center overflow-y-auto scrollbar-thin">
              {!showCheckout ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-neon-purple animate-pulse">
                    <Crown className="w-8 h-8 fill-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Review Subscription Details</h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-sm mx-auto">
                      You are about to subscribe to the **{selectedPlan} Creator** plan billed **{billingPeriod}**. Enjoy premium features instantly.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all cursor-pointer shadow-neon-purple hover:opacity-95 mx-auto block"
                  >
                    Proceed to Simulated Checkout
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Simulated Checkout</span>
                  </div>

                  {/* Cardholder Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Name on Card</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Sarah Chen"
                      className="w-full text-xs py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                    />
                    {errors.cardName && <span className="text-[9px] text-red-400 font-bold block">{errors.cardName}</span>}
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full text-xs py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                    />
                    {errors.cardNumber && <span className="text-[9px] text-red-400 font-bold block">{errors.cardNumber}</span>}
                  </div>

                  {/* Expiry & CVC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/YY"
                        className="w-full text-xs py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                      />
                      {errors.expiry && <span className="text-[9px] text-red-400 font-bold block">{errors.expiry}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CVC</label>
                      <input
                        type="text"
                        required
                        maxLength="4"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="123"
                        className="w-full text-xs py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-white placeholder-text-muted outline-none transition-all"
                      />
                      {errors.cvc && <span className="text-[9px] text-red-400 font-bold block">{errors.cvc}</span>}
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex gap-2 items-center text-[10px] text-text-muted bg-white/[0.01] p-2.5 rounded-xl border border-white/5">
                    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                    <span>Mock card authorization. No real payment transaction is executed.</span>
                  </div>

                  {/* Submit Checkout */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all cursor-pointer shadow-neon-purple hover:opacity-95 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing simulated checkout...</span>
                      </>
                    ) : (
                      <span>Submit Payment Simulator</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
