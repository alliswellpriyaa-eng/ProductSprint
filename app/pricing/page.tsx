"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";

const FREE_FEATURES = [
  "3 product idea generations / day",
  "3 SEO title generations / day",
  "3 Etsy tag generations / day",
  "1 Sprint Blueprint / day",
  "1 × 30-Day Sprint Plan / day",
  "Access to all niches & product types",
];

const PRO_FEATURES = [
  "Unlimited idea generations",
  "Unlimited SEO titles & tags",
  "Unlimited Sprint Blueprints",
  "Unlimited 30-Day Sprint Plans",
  "Priority AI responses",
  "Everything in Free",
];

export default function PricingPage() {
  const { user, loading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPremium = user?.plan === "premium";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center">
              PS
            </span>
            <span className="font-bold text-gray-900">ProductSprint</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to app
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Simple, honest pricing
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Start free. Upgrade when you&apos;re ready to go unlimited.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Free
              </span>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-black text-gray-900">$0</span>
                <span className="text-gray-400 text-sm mb-1">/ month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Perfect for getting started
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {loading ? null : !user ? (
              <Link
                href="/signup"
                className="block text-center border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Get started free
              </Link>
            ) : (
              <div className="text-center py-2.5 rounded-lg bg-gray-50 text-gray-500 text-sm font-medium">
                {isPremium ? "Included in Pro" : "✓ Your current plan"}
              </div>
            )}
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 flex flex-col text-white relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
              POPULAR
            </div>

            <div className="mb-4">
              <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Sprint Pro
              </span>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-black">$10</span>
                <span className="text-violet-200 text-sm mb-1">/ month</span>
              </div>
              <p className="text-sm text-violet-200 mt-1">
                For serious Etsy sellers
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-amber-300 mt-0.5">⚡</span>
                  {f}
                </li>
              ))}
            </ul>

            {loading ? null : isPremium ? (
              <button
                onClick={handlePortal}
                disabled={checkoutLoading}
                className="block text-center bg-white/20 hover:bg-white/30 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60"
              >
                {checkoutLoading ? "Loading…" : "Manage subscription →"}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="block w-full text-center bg-white hover:bg-violet-50 text-violet-700 font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60"
              >
                {checkoutLoading
                  ? "Redirecting…"
                  : user
                  ? "Upgrade to Sprint Pro →"
                  : "Start Sprint Pro →"}
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-xl mx-auto space-y-5">
          <h2 className="text-center text-lg font-bold text-gray-900">
            Questions
          </h2>
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes — cancel from your billing portal and you keep Pro access until the end of your billing period.",
            },
            {
              q: "Do free limits reset daily?",
              a: "Yes. Free-plan usage resets at midnight UTC each day.",
            },
            {
              q: "Is there a trial period?",
              a: "The free plan is effectively a trial. Upgrade when you're ready to go unlimited.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-5">
              <p className="text-sm font-semibold text-gray-800">{q}</p>
              <p className="text-sm text-gray-500 mt-1">{a}</p>
            </div>
          ))}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signup"
        reason="Create a free account to continue, then upgrade to Sprint Pro."
      />
    </div>
  );
}
